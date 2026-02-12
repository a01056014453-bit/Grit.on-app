"""
YAMNet 기반 연습 분석 서버
Flask로 구동되며, 오디오 파일을 받아 분석 결과를 반환합니다.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import tensorflow as tf
import tensorflow_hub as hub
import numpy as np
import librosa
import pandas as pd
import tempfile
import os

app = Flask(__name__)
CORS(app)

print("YAMNet 모델 로딩 중...")
model = hub.load('https://tfhub.dev/google/yamnet/1')
class_map_path = model.class_map_path().numpy().decode('utf-8')
class_names = pd.read_csv(class_map_path)['display_name'].values
print("모델 로딩 완료!")

# 악기 관련 키워드 ('Music' 단독은 너무 광범위하므로 'Musical instrument'로 제한)
INSTRUMENT_KEYWORDS = [
    'Music', 'Piano', 'Guitar', 'Violin', 'Cello', 'Flute', 'Drum',
    'Keyboard', 'Organ', 'Harp', 'Accordion', 'Harmonica', 'Banjo',
    'Mandolin', 'Ukulele', 'Bass', 'Synthesizer', 'Electric piano',
    'Plucked string instrument', 'Bowed string instrument',
    'Brass instrument', 'Wind instrument', 'Percussion'
]

# 목소리 관련 키워드
SPEECH_KEYWORDS = ['Speech', 'Conversation', 'Narration', 'Singing', 'Chant']

# 메트로놈/클릭 관련 키워드 (메트로놈 ON일 때 제외)
METRONOME_KEYWORDS = ['Click', 'Clicking', 'Tick', 'Ticking', 'Wood block', 'Claves']

# 무음/잡음 키워드
SILENCE_KEYWORDS = ['Silence', 'White noise', 'Pink noise', 'Static']

def analyze_audio(audio_path, metronome_on=False):
    """
    오디오 파일을 분석하여 연습/대화/잡음 시간을 반환합니다.

    Args:
        audio_path: 오디오 파일 경로
        metronome_on: 메트로놈이 켜져 있었는지 여부

    Returns:
        dict: 분석 결과
    """
    # 오디오 로드 (16kHz로 변환)
    wav_data, sr = librosa.load(audio_path, sr=16000)

    # YAMNet 추론
    scores, embeddings, spectrogram = model(wav_data)
    scores_np = scores.numpy()

    # 세그먼트별 분류
    segment_duration = 0.48  # YAMNet 세그먼트 길이(초)

    results = {
        'instrument_time': 0,
        'voice_time': 0,
        'silence_time': 0,
        'noise_time': 0,
        'metronome_time': 0,
        'total_time': len(scores_np) * segment_duration,
        'segments': []
    }

    for i, score in enumerate(scores_np):
        # Top 3 클래스 확인
        top_indices = score.argsort()[-3:][::-1]
        top_class = class_names[top_indices[0]]
        confidence = float(score[top_indices[0]])

        segment_info = {
            'time': i * segment_duration,
            'class': top_class,
            'confidence': confidence,
            'category': 'noise'
        }

        # 카테고리 분류
        is_instrument = any(kw.lower() in top_class.lower() for kw in INSTRUMENT_KEYWORDS)
        is_speech = any(kw.lower() in top_class.lower() for kw in SPEECH_KEYWORDS)
        is_metronome = any(kw.lower() in top_class.lower() for kw in METRONOME_KEYWORDS)
        is_silence = any(kw.lower() in top_class.lower() for kw in SILENCE_KEYWORDS)

        if is_metronome and metronome_on:
            # 메트로놈 ON 상태에서 메트로놈 소리 감지 -> 별도 처리
            results['metronome_time'] += segment_duration
            segment_info['category'] = 'metronome'
        elif is_instrument:
            results['instrument_time'] += segment_duration
            segment_info['category'] = 'instrument'
        elif is_speech:
            results['voice_time'] += segment_duration
            segment_info['category'] = 'voice'
        elif is_silence:
            results['silence_time'] += segment_duration
            segment_info['category'] = 'silence'
        else:
            results['noise_time'] += segment_duration
            segment_info['category'] = 'noise'

        results['segments'].append(segment_info)

    # 비율 계산
    total = results['total_time']
    if total > 0:
        results['instrument_percent'] = round(results['instrument_time'] / total * 100, 1)
        results['voice_percent'] = round(results['voice_time'] / total * 100, 1)
        results['silence_percent'] = round(results['silence_time'] / total * 100, 1)
        results['noise_percent'] = round(results['noise_time'] / total * 100, 1)
        results['metronome_percent'] = round(results['metronome_time'] / total * 100, 1)

    # 순수 연습 시간 = 악기 시간 (메트로놈 제외됨)
    results['net_practice_time'] = results['instrument_time']

    return results

@app.route('/analyze', methods=['POST'])
def analyze():
    """오디오 분석 API 엔드포인트"""
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file provided'}), 400

    audio_file = request.files['audio']
    metronome_on = request.form.get('metronome', 'false').lower() == 'true'

    # 임시 파일로 저장
    with tempfile.NamedTemporaryFile(delete=False, suffix='.webm') as tmp:
        audio_file.save(tmp.name)
        tmp_path = tmp.name

    try:
        results = analyze_audio(tmp_path, metronome_on)
        return jsonify(results)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        # 임시 파일 삭제
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

@app.route('/health', methods=['GET'])
def health():
    """헬스 체크"""
    return jsonify({'status': 'ok', 'model': 'YAMNet loaded'})

if __name__ == '__main__':
    print("분석 서버 시작: http://localhost:5001")
    app.run(host='0.0.0.0', port=5001, debug=False)


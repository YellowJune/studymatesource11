import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import json
import base64
from io import BytesIO
from PIL import Image
import openai
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)

# OpenAI 클라이언트 초기화
client = openai.OpenAI()

@app.route("/webhook", methods=["POST"])
def kakao_webhook():
    """카카오톡 웹훅 엔드포인트"""
    try:
        data = request.json
        
        # 사용자 정보 추출
        user_key = data.get("userRequest", {}).get("user", {}).get("id")
        utterance = data.get("userRequest", {}).get("utterance", "")
        
        # 액션 타입에 따른 처리
        action = data.get("action", {}).get("name", "")
        
        if action == "photo_solve":
            return handle_photo_solve(data)
        elif action == "study_planner":
            return handle_study_planner(data)
        else:
            return handle_default_message(utterance)
            
    except Exception as e:
        print(f"Error in webhook: {str(e)}")
        return jsonify({
            "version": "2.0",
            "template": {
                "outputs": [{
                    "simpleText": {
                        "text": "죄송합니다. 오류가 발생했습니다. 다시 시도해주세요."
                    }
                }]
            }
        })

def handle_photo_solve(data):
    """사진 문제풀이 처리"""
    try:
        # 카카오톡에서 이미지 URL 추출
        image_url = None
        
        # 파라미터에서 이미지 정보 추출
        params = data.get("action", {}).get("params", {})
        if "image" in params:
            image_info = params["image"]
            if isinstance(image_info, dict):
                image_url = image_info.get("secureUrl") or image_info.get("url")
            elif isinstance(image_info, str):
                image_url = image_info
        
        # 다른 방식으로 이미지 URL 추출 시도
        if not image_url:
            user_request = data.get("userRequest", {})
            if "photo" in user_request:
                image_url = user_request["photo"]["imageUrl"]
            elif "attachment" in user_request:
                attachment = user_request["attachment"]
                if attachment.get("type") == "image":
                    image_url = attachment.get("payload", {}).get("url")
        
        if not image_url:
            return jsonify({
                "version": "2.0",
                "template": {
                    "outputs": [{
                        "simpleText": {
                            "text": "📸 사진을 업로드해주세요!\n\n문제가 포함된 이미지를 보내주시면 다음과 같이 도와드립니다:\n\n✅ 문제 유형 분석\n✅ 단계별 풀이 과정\n✅ 최종 답안 제시\n✅ 개념 설명 및 팁\n\n수학, 과학, 영어 등 다양한 과목을 지원합니다!"
                        }
                    }],
                    "quickReplies": [{
                        "label": "📷 사진 업로드",
                        "action": "camera"
                    }, {
                        "label": "📁 갤러리에서 선택",
                        "action": "gallery"
                    }]
                }
            })
        
        # 이미지 분석 및 문제 풀이
        solution = analyze_and_solve_problem(image_url)
        
        # 응답 길이에 따라 처리 방식 결정
        if len(solution) > 1000:
            # 긴 답변의 경우 요약본과 상세본으로 분리
            summary = solution[:500] + "...\n\n📝 전체 풀이를 보시려면 '상세 풀이'를 선택해주세요."
            
            return jsonify({
                "version": "2.0",
                "template": {
                    "outputs": [{
                        "simpleText": {
                            "text": summary
                        }
                    }],
                    "quickReplies": [{
                        "label": "📋 상세 풀이",
                        "action": "message",
                        "messageText": "상세 풀이 보기"
                    }, {
                        "label": "📸 다른 문제",
                        "action": "message",
                        "messageText": "사진 문제풀이"
                    }, {
                        "label": "📅 스터디 플래너",
                        "action": "message", 
                        "messageText": "스터디 플래너"
                    }]
                }
            })
        else:
            return jsonify({
                "version": "2.0",
                "template": {
                    "outputs": [{
                        "simpleText": {
                            "text": solution
                        }
                    }],
                    "quickReplies": [{
                        "label": "📸 다른 문제",
                        "action": "message",
                        "messageText": "사진 문제풀이"
                    }, {
                        "label": "📅 스터디 플래너",
                        "action": "message", 
                        "messageText": "스터디 플래너"
                    }, {
                        "label": "💡 학습 팁",
                        "action": "message",
                        "messageText": "학습 팁"
                    }]
                }
            })
        
    except Exception as e:
        print(f"Error in photo solve: {str(e)}")
        return jsonify({
            "version": "2.0",
            "template": {
                "outputs": [{
                    "simpleText": {
                        "text": "🔧 이미지 분석 중 오류가 발생했습니다.\n\n다음을 확인해주세요:\n• 이미지가 선명한가요?\n• 문제가 잘 보이나요?\n• 파일 크기가 너무 크지 않나요?\n\n다시 시도해주세요!"
                    }
                }],
                "quickReplies": [{
                    "label": "🔄 다시 시도",
                    "action": "message",
                    "messageText": "사진 문제풀이"
                }]
            }
        })

def analyze_and_solve_problem(image_url):
    """이미지 분석 및 문제 풀이"""
    try:
        # OpenAI Vision API를 사용하여 이미지 분석
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": """당신은 전문적인 학습 도우미입니다. 학생들의 문제 해결을 도와주는 역할을 합니다.\n\n다음 원칙을 따라주세요:\n1. 친근하고 격려하는 톤으로 설명\n2. 단계별로 명확하게 풀이 과정 제시\n3. 개념 설명을 포함하여 이해도 향상\n4. 유사한 문제 해결 팁 제공\n5. 한국어로 답변"""
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": """이 이미지에 있는 문제를 분석하고 단계별로 풀이해주세요.\n\n다음 형식으로 답변해주세요:\n\n🔍 **문제 분석**\n- 문제 유형과 핵심 개념 설명\n\n📝 **단계별 풀이**\n1. 첫 번째 단계\n2. 두 번째 단계\n3. ...\n\n✅ **최종 답안**\n- 명확한 답 제시\n\n💡 **학습 포인트**\n- 핵심 개념 정리\n- 실수하기 쉬운 부분\n- 유사 문제 해결 팁\n\n친근하고 이해하기 쉽게 설명해주세요!"""
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": image_url,
                                "detail": "high"
                            }
                        }
                    ]
                }
            ],
            max_tokens=1500,
            temperature=0.3
        )
        
        solution = response.choices[0].message.content
        
        # 응답이 너무 짧은 경우 추가 설명 요청
        if len(solution) < 100:
            return "🤔 이미지에서 문제를 명확하게 인식하지 못했습니다.\n\n다음을 확인해주세요:\n• 문제가 선명하게 보이나요?\n• 글씨가 잘 읽히나요?\n• 전체 문제가 포함되어 있나요?\n\n더 선명한 이미지로 다시 시도해주세요!"
        
        return solution
        
    except openai.RateLimitError:
        return "⏰ 현재 요청이 많아 잠시 대기가 필요합니다.\n\n1-2분 후에 다시 시도해주세요!"
        
    except openai.APIError as e:
        print(f"OpenAI API Error: {str(e)}")
        return "🔧 AI 서비스에 일시적인 문제가 발생했습니다.\n\n잠시 후 다시 시도해주세요."
        
    except Exception as e:
        print(f"Error in OpenAI API: {str(e)}")
        return "❌ 이미지 분석 중 오류가 발생했습니다.\n\n다음을 확인해주세요:\n• 이미지 파일이 손상되지 않았나요?\n• 인터넷 연결이 안정적인가요?\n\n문제가 계속되면 다른 이미지로 시도해보세요."

def handle_study_planner(data):
    """스터디 플래너 처리"""
    try:
        # 플래너 웹 인터페이스 URL 생성
        planner_url = "https://studymatesource11.vercel.app/"
        
        return jsonify({
            "version": "2.0",
            "template": {
                "outputs": [{
                    "basicCard": {
                        "title": "📅 스터디 플래너",
                        "description": "개인 맞춤 학습 계획을 세우고 관리해보세요!\n\n캘린더를 열어서 스터디 계획을 관리할 수 있습니다.",
                        "buttons": [{
                            "label": "플래너 열기",
                            "action": "webLink",
                            "webLinkUrl": planner_url
                        }]
                    }
                }],
                "quickReplies": [{
                    "label": "사진 문제풀이",
                    "action": "message",
                    "messageText": "사진 문제풀이"
                }, {
                    "label": "오늘의 계획",
                    "action": "message",
                    "messageText": "오늘 계획"
                }]
            }
        })
        
    except Exception as e:
        print(f"Error in study planner: {str(e)}")
        return jsonify({
            "version": "2.0",
            "template": {
                "outputs": [{
                    "simpleText": {
                        "text": "플래너 조회 중 오류가 발생했습니다. 다시 시도해주세요."
                    }
                }]
            }
        })

def handle_default_message(utterance):
    """기본 메시지 처리"""
    if "안녕" in utterance or "시작" in utterance:
        return jsonify({
            "version": "2.0",
            "template": {
                "outputs": [{
                    "simpleText": {
                        "text": f"안녕하세요! StudyMate입니다 📚\n\n저는 다음과 같은 기능을 제공합니다:\n\n1️⃣ 사진 문제풀이: 문제 사진을 보내주시면 단계별로 풀이해드려요\n2️⃣ 스터디 플래너: 개인 맞춤 학습 계획을 세우고 관리할 수 있어요\n\n어떤 기능을 사용하시겠어요?"
                    }
                }],
                "quickReplies": [{
                    "label": "📸 사진 문제풀이",
                    "action": "message",
                    "messageText": "사진 문제풀이"
                }, {
                    "label": "📅 스터디 플래너", 
                    "action": "message",
                    "messageText": "스터디 플래너"
                }]
            }
        })
    
    elif "문제" in utterance or "풀이" in utterance or "사진" in utterance:
        return jsonify({
            "version": "2.0",
            "template": {
                "outputs": [{
                    "simpleText": {
                        "text": "📸 사진 문제풀이 모드입니다!\n\n문제가 포함된 사진을 업로드해주세요. 수학, 과학, 영어 등 다양한 과목의 문제를 분석하고 단계별로 풀이해드립니다."
                    }
                }]
            }
        })
    
    elif "플래너" in utterance or "계획" in utterance or "스터디" in utterance:
        return handle_study_planner({})
    
    else:
        return jsonify({
            "version": "2.0",
            "template": {
                "outputs": [{
                    "simpleText": {
                        "text": "무엇을 도와드릴까요?\n\n• '사진 문제풀이' - 문제 사진 분석 및 풀이\n• '스터디 플래너' - 학습 계획 관리\n\n위 기능 중 하나를 선택해주세요!"
                    }
                }],
                "quickReplies": [{
                    "label": "📸 사진 문제풀이",
                    "action": "message", 
                    "messageText": "사진 문제풀이"
                }, {
                    "label": "📅 스터디 플래너",
                    "action": "message",
                    "messageText": "스터디 플래너"
                }]
            }
        })

# Vercel에서 Flask 앱을 실행하기 위한 진입점
if __name__ == "__main__":
    app.run(debug=True)

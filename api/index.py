import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from src.routes.chatbot import chatbot_bp
from src.routes.planner import planner_bp
from src.models.user import User
from src.models.planner import StudyPlan
from src import db # 여기를 수정

app = Flask(__name__)
CORS(app)

# 데이터베이스 설정
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL", "sqlite:////tmp/app.db")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db.init_app(app) # 여기를 수정

# Blueprint 등록
app.register_blueprint(chatbot_bp, url_prefix="/chatbot")
app.register_blueprint(planner_bp, url_prefix="/api")

@app.route("/")
def home():
    return "StudyMate KakaoTalk Chatbot Backend"

# 데이터베이스 초기화 (Vercel 배포 시에는 빌드 스크립트에서 처리)
with app.app_context():
    db.create_all() # 여기를 수정

# Vercel에서 Flask 앱을 실행하기 위한 진입점
# Vercel은 이 `app` 객체를 사용하여 서버리스 함수를 생성합니다.

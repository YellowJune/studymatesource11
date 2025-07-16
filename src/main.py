import os
import sys
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, render_template, session
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import os

# Flask 앱 생성
app = Flask(__name__, static_folder='static', template_folder='static')

# 설정
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your-secret-key-here')
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///studymate.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# CORS 설정
CORS(app, supports_credentials=True)

# 데이터베이스 초기화
from src import db
db.init_app(app)

# 라우트 등록
from src.routes.user import user_bp
from src.routes.chatbot import chatbot_bp
from src.routes.planner import planner_bp
from src.routes.auth import auth_bp  # 새로 추가

app.register_blueprint(user_bp, url_prefix="/api/user")
app.register_blueprint(chatbot_bp, url_prefix="/api/chatbot")
app.register_blueprint(planner_bp, url_prefix="/api/planner")
app.register_blueprint(auth_bp, url_prefix="/api/auth")  # 새로 추가

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/planner")
def planner():
    return render_template("index.html")

# 데이터베이스 테이블 생성
with app.app_context():
    db.create_all()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)

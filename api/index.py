import os
import sys

# 경로 설정
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy

# Flask 앱 생성
app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), '..', 'src', 'static'))
app.config['SECRET_KEY'] = 'asdf#FGSgvasgf$5$WGT'

# CORS 설정
CORS(app)

# 데이터베이스 설정
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:////tmp/app.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# 데이터베이스 초기화
db = SQLAlchemy(app)

# 모델 정의 (직접 정의)
from datetime import datetime

class StudyPlan(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(50), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    plan_date = db.Column(db.Date, nullable=False)
    start_time = db.Column(db.Time, nullable=True)
    end_time = db.Column(db.Time, nullable=True)
    subject = db.Column(db.String(100), nullable=True)
    priority = db.Column(db.String(20), default="medium")
    status = db.Column(db.String(20), default="planned")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "title": self.title,
            "description": self.description,
            "plan_date": self.plan_date.isoformat() if self.plan_date else None,
            "start_time": self.start_time.strftime("%H:%M") if self.start_time else None,
            "end_time": self.end_time.strftime("%H:%M") if self.end_time else None,
            "subject": self.subject,
            "priority": self.priority,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }

# 라우트 정의 (직접 정의)
from flask import jsonify, request
from datetime import date, timedelta

@app.route("/api/planner/plans/<user_id>", methods=["GET"])
def get_user_plans(user_id):
    """사용자의 스터디 플랜 조회"""
    try:
        # 날짜 범위 파라미터 처리
        start_date_str = request.args.get("start_date")
        end_date_str = request.args.get("end_date")
        
        if start_date_str and end_date_str:
            start_date = datetime.strptime(start_date_str, "%Y-%m-%d").date()
            end_date = datetime.strptime(end_date_str, "%Y-%m-%d").date()
        else:
            # 기본값: 전체 기간 (최근 30일부터 향후 30일까지)
            today = date.today()
            start_date = today - timedelta(days=30)
            end_date = today + timedelta(days=30)
        
        # 문자열 user_id를 사용하여 플랜 조회
        plans = StudyPlan.query.filter(
            StudyPlan.user_id == user_id,
            StudyPlan.plan_date >= start_date,
            StudyPlan.plan_date <= end_date
        ).order_by(StudyPlan.plan_date, StudyPlan.start_time).all()
        
        return jsonify({
            "success": True,
            "plans": [plan.to_dict() for plan in plans],
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat()
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route("/api/planner/plans", methods=["POST"])
def create_plan():
    """새 스터디 플랜 생성"""
    try:
        data = request.json
        
        # 필수 필드 검증
        required_fields = ["user_id", "title", "plan_date"]
        for field in required_fields:
            if field not in data:
                return jsonify({
                    "success": False,
                    "error": f"Missing required field: {field}"
                }), 400
        
        # 날짜 파싱
        plan_date = datetime.strptime(data["plan_date"], "%Y-%m-%d").date()
        
        # 시간 파싱 (선택사항)
        start_time = None
        end_time = None
        if data.get("start_time"):
            start_time = datetime.strptime(data["start_time"], "%H:%M").time()
        if data.get("end_time"):
            end_time = datetime.strptime(data["end_time"], "%H:%M").time()
        
        # 새 플랜 생성
        plan = StudyPlan(
            user_id=data["user_id"],
            title=data["title"],
            description=data.get("description", ""),
            plan_date=plan_date,
            start_time=start_time,
            end_time=end_time,
            subject=data.get("subject", ""),
            priority=data.get("priority", "medium"),
            status=data.get("status", "planned")
        )
        
        db.session.add(plan)
        db.session.commit()
        
        return jsonify(plan.to_dict()), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route("/api/planner/plans/<int:plan_id>", methods=["PUT"])
def update_plan(plan_id):
    """스터디 플랜 수정"""
    try:
        plan = StudyPlan.query.get_or_404(plan_id)
        data = request.json
        
        # 업데이트 가능한 필드들
        if "title" in data:
            plan.title = data["title"]
        if "description" in data:
            plan.description = data["description"]
        if "plan_date" in data:
            plan.plan_date = datetime.strptime(data["plan_date"], "%Y-%m-%d").date()
        if "start_time" in data:
            plan.start_time = datetime.strptime(data["start_time"], "%H:%M").time() if data["start_time"] else None
        if "end_time" in data:
            plan.end_time = datetime.strptime(data["end_time"], "%H:%M").time() if data["end_time"] else None
        if "subject" in data:
            plan.subject = data["subject"]
        if "priority" in data:
            plan.priority = data["priority"]
        if "status" in data:
            plan.status = data["status"]
        
        plan.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify(plan.to_dict())
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route("/api/planner/plans/<int:plan_id>", methods=["DELETE"])
def delete_plan(plan_id):
    """스터디 플랜 삭제"""
    try:
        plan = StudyPlan.query.get_or_404(plan_id)
        db.session.delete(plan)
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": "Plan deleted successfully"
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route("/api/planner/stats/<user_id>", methods=["GET"])
def get_user_stats(user_id):
    """사용자 스터디 통계 조회"""
    try:
        # 이번 주 통계
        today = date.today()
        week_start = today - timedelta(days=today.weekday())
        week_end = week_start + timedelta(days=6)
        
        # 이번 주 플랜들
        week_plans = StudyPlan.query.filter(
            StudyPlan.user_id == user_id,
            StudyPlan.plan_date >= week_start,
            StudyPlan.plan_date <= week_end
        ).all()
        
        # 통계 계산
        total_plans = len(week_plans)
        completed_plans = len([p for p in week_plans if p.status == "completed"])
        in_progress_plans = len([p for p in week_plans if p.status == "in_progress"])
        planned_plans = len([p for p in week_plans if p.status == "planned"])
        
        # 과목별 통계
        subject_stats = {}
        for plan in week_plans:
            subject = plan.subject or "기타"
            if subject not in subject_stats:
                subject_stats[subject] = {"total": 0, "completed": 0}
            subject_stats[subject]["total"] += 1
            if plan.status == "completed":
                subject_stats[subject]["completed"] += 1
        
        return jsonify({
            "success": True,
            "stats": {
                "week_period": {
                    "start": week_start.isoformat(),
                    "end": week_end.isoformat()
                },
                "total_plans": total_plans,
                "completed_plans": completed_plans,
                "in_progress_plans": in_progress_plans,
                "planned_plans": planned_plans,
                "completion_rate": round((completed_plans / total_plans * 100) if total_plans > 0 else 0, 1),
                "subject_stats": subject_stats
            }
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# 정적 파일 서빙
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    static_folder_path = app.static_folder
    if static_folder_path is None:
        return "Static folder not configured", 404

    if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
        return send_from_directory(static_folder_path, path)
    else:
        index_path = os.path.join(static_folder_path, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(static_folder_path, 'index.html')
        else:
            return "index.html not found", 404

# 데이터베이스 초기화
with app.app_context():
    db.create_all()

# Vercel 진입점
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

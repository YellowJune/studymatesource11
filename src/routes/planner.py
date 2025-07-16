from flask import Blueprint, jsonify, request
from datetime import datetime, date, timedelta
from src.models.user import User, db
from src.models.planner import StudyPlan

planner_bp = Blueprint("planner", __name__)

@planner_bp.route("/plans", methods=["GET"])
def get_user_plans():
    """사용자의 스터디 플랜 조회 (쿼리 파라미터로 user_id 받음)"""
    try:
        # 쿼리 파라미터에서 user_id 추출
        user_id = request.args.get("user_id")
        if not user_id:
            return jsonify({
                "success": False,
                "error": "user_id parameter is required"
            }), 400
        
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
        
        plans = StudyPlan.query.filter(
            StudyPlan.user_id == user_id,
            StudyPlan.plan_date >= start_date,
            StudyPlan.plan_date <= end_date
        ).order_by(StudyPlan.plan_date, StudyPlan.start_time).all()
        
        return jsonify([plan.to_dict() for plan in plans])
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@planner_bp.route("/plans/<int:user_id>", methods=["GET"])
def get_user_plans_legacy(user_id):
    """사용자의 스터디 플랜 조회 (기존 방식 - 호환성 유지)"""
    try:
        # 날짜 범위 파라미터 처리
        start_date_str = request.args.get("start_date")
        end_date_str = request.args.get("end_date")
        
        if start_date_str and end_date_str:
            start_date = datetime.strptime(start_date_str, "%Y-%m-%d").date()
            end_date = datetime.strptime(end_date_str, "%Y-%m-%d").date()
        else:
            # 기본값: 이번 주
            today = date.today()
            start_date = today - timedelta(days=today.weekday())
            end_date = start_date + timedelta(days=6)
        
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

@planner_bp.route("/plans", methods=["POST"])
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

@planner_bp.route("/plans/<int:plan_id>", methods=["PUT"])
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

@planner_bp.route("/plans/<int:plan_id>", methods=["DELETE"])
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

@planner_bp.route("/plans/<int:plan_id>/status", methods=["PATCH"])
def update_plan_status(plan_id):
    """스터디 플랜 상태 업데이트"""
    try:
        plan = StudyPlan.query.get_or_404(plan_id)
        data = request.json
        
        if "status" not in data:
            return jsonify({
                "success": False,
                "error": "Status field is required"
            }), 400
        
        valid_statuses = ["planned", "in_progress", "completed", "cancelled"]
        if data["status"] not in valid_statuses:
            return jsonify({
                "success": False,
                "error": f"Invalid status. Must be one of: {valid_statuses}"
            }), 400
        
        plan.status = data["status"]
        plan.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            "success": True,
            "plan": plan.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@planner_bp.route("/stats/<int:user_id>", methods=["GET"])
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

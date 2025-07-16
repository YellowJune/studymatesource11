from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, date
from src.models.user import db

class StudyPlan(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    plan_date = db.Column(db.Date, nullable=False)
    start_time = db.Column(db.Time, nullable=True)
    end_time = db.Column(db.Time, nullable=True)
    subject = db.Column(db.String(100), nullable=True)  # 과목
    priority = db.Column(db.String(20), default='medium')  # high, medium, low
    status = db.Column(db.String(20), default='planned')  # planned, in_progress, completed, cancelled
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f'<StudyPlan {self.title} - {self.plan_date}>'

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'description': self.description,
            'plan_date': self.plan_date.isoformat() if self.plan_date else None,
            'start_time': self.start_time.strftime('%H:%M') if self.start_time else None,
            'end_time': self.end_time.strftime('%H:%M') if self.end_time else None,
            'subject': self.subject,
            'priority': self.priority,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

    @staticmethod
    def get_weekly_plans(user_id, start_date):
        """특정 주의 계획들을 조회"""
        from datetime import timedelta
        end_date = start_date + timedelta(days=6)
        
        return StudyPlan.query.filter(
            StudyPlan.user_id == user_id,
            StudyPlan.plan_date >= start_date,
            StudyPlan.plan_date <= end_date
        ).order_by(StudyPlan.plan_date, StudyPlan.start_time).all()

    @staticmethod
    def get_daily_plans(user_id, target_date):
        """특정 날짜의 계획들을 조회"""
        return StudyPlan.query.filter(
            StudyPlan.user_id == user_id,
            StudyPlan.plan_date == target_date
        ).order_by(StudyPlan.start_time).all()


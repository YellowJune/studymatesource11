from src import db
from datetime import datetime

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    kakao_user_id = db.Column(db.String(100), unique=True, nullable=False)
    username = db.Column(db.String(80), nullable=False)
    email = db.Column(db.String(120), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # 스터디 플랜과의 관계
    study_plans = db.relationship(\'StudyPlan\', backref=\'user\', lazy=True, cascade=\'all, delete-orphan\')

    def __repr__(self):
        return f\'<{self.username}>\'

    def to_dict(self):
        return {
            \'id\': self.id,
            \'kakao_user_id\': self.kakao_user_id,
            \'username\': self.username,
            \'email\': self.email,
            \'created_at\': self.created_at.isoformat() if self.created_at else None
        }

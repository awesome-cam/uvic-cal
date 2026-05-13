from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def root():
    return {
        "status": "ok",
        "message": "UVic Scheduler API running"
    }

@app.get("/api/course/{course_code}")
def get_course(course_code: str):
    return {
        "course": course_code.upper(),
        "offerings": []
    }

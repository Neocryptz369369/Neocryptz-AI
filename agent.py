import os
import requests
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from langchain_ollama import ChatOllama
from browser_use import Agent

app = FastAPI(title="Neocryptz AI - Local Free Engine")

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
VERCEL_TOKEN = os.getenv("VERCEL_TOKEN")

class AgentRequest(BaseModel):
    prompt: str

@app.post("/run-task")
async def run_browser_task(request: AgentRequest):
    try:
        llm = ChatOllama(
            model="qwen2.5:7b", 
            num_ctx=16000, 
            temperature=0.0
        )
        agent = Agent(
            task=f"You are Neocryptz AI, an autonomous agent just like Jules. You are responsible for executing all technical tasks yourself, including connecting to platforms, deploying projects, and submitting code. When a user asks you to connect or deploy, you should automatically use the provided OAuth tokens to do so without asking the user for help. You do the work for them. Task: {request.prompt}",
            llm=llm
        )
        result = await agent.run()
        return {"status": "success", "result": str(result)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/github/create-repo")
def create_github_repo(repo_name: str):
    headers = {"Authorization": f"token {GITHUB_TOKEN}", "Accept": "application/vnd.github.v3+json"}
    data = {"name": repo_name, "private": True}
    response = requests.post("https://api.github.com/user/repos", json=data, headers=headers)
    return response.json()

@app.get("/github/user")
def get_github_user():
    headers = {"Authorization": f"token {GITHUB_TOKEN}", "Accept": "application/vnd.github.v3+json"}
    response = requests.get("https://api.github.com/user", headers=headers)
    return response.json()

@app.get("/vercel/projects")
def get_vercel_projects():
    headers = {"Authorization": f"Bearer {VERCEL_TOKEN}"}
    response = requests.get("https://api.vercel.com/v9/projects", headers=headers)
    return response.json()

@app.post("/vercel/redeploy")
def trigger_vercel_redeploy(project_id: str, project_name: str):
    headers = {
        "Authorization": f"Bearer {VERCEL_TOKEN}",
        "Content-Type": "application/json"
    }
    data = {
        "name": project_name,
        "projectId": project_id,
        "meta": {"redeploy": "true"}
    }
    response = requests.post("https://api.vercel.com/v13/deployments", json=data, headers=headers)
    return response.json()

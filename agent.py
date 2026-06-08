import os
import requests
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from langchain_ollama import ChatOllama
from browser_use import Agent

app = FastAPI(title="NEOCRYPTZ AI - Local Free Engine")

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
            task=f"You are NEOCRYPTZ AI. Task: {request.prompt}", 
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)

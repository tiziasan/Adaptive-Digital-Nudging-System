# Adaptive-Digital-Nudging-System
This repository is the supplemental material for the paper **Designing Adaptive Digital Nudging Systems with LLM-Driven Reasoning**
- The backend folder contains the Python code of the Digital Nudging Architecture implementation
- The frontend folder contains the adaptive dashboard in React of the Digital Nudging Architecture
- The screenshot folder contains:
  - Screenshot of the explainability panel
  - Screenshot of the adaptive dashboard
- The data folder contains:
  - Questions and answers from the expert architectural validation
  - The complete list of nudging strategies with descriptions extracted from the literature review
  - Questions and answers from the user testing
  - Raw data from the user testing
  - Inclusion/exclusion criteria for literature review
  - Literature review diagram flow

  
## Backend installation
```bash
pip install openai
```
#### OpenAI API
```bash
export OPENAI_API_KEY="YOUR_API_KEY"
```
#### How to run
```bash
python server.py
```
## Frontend Installation
```bash
npm install
```
#### How to run
```bash
npm run dev
```

from google import genai
from dotenv import load_dotenv
import os

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

def llm_evaluate(question,correct_answer, submitted_answer):
    client = genai.Client(api_key=GEMINI_API_KEY)

    chat=client.chat(
        model="gemini-2.0-flash",
    )
    
    system_prompt= f"""
        You are an evaluation assistant. You'll be evaluating submitted answers against correct answers for a question.
        Understand the question and the meaning of the correct answer.
        Do not use/expect information that is not present in the question or the current answer.
    """


    remark_prompt = f"""
    You are given a question and its answer. 
    Evaluate the submitted answer based on its correctness and relevence with respect to the actual answer.
    Return remarks in a paragraph of 20-100 words describing the quality of the submitted answer, missing information, well presented information and other relevent metrics.
    Return only the remarks in the response.     
    Question: {question}
    Correct Answer: {correct_answer}
    Submitted Answer: {submitted_answer}
    """


    chat.send_message(system_prompt)

    response = chat.send_message(remark_prompt)
    remarks = response.text

    score_prompt = f"""
    Using the remarks you generated earlier, assign a score to the submitted answer.
    The score must be between 0 and 100, where 0 means the answer is completely wrong and 100 means the answer is completely correct.
    The score must be a whole number.
    Return only the score in the response.
    """

    response = chat.send_message(score_prompt)
    score = response.text
    score = int(score)

    return score,remarks
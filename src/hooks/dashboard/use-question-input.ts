import { useState, useCallback } from 'react';

export interface QuestionInputState {
  question: string;
  setQuestion: (value: string) => void;
  clearQuestion: () => void;
}

export function useQuestionInput(): QuestionInputState {
  const [question, setQuestion] = useState('');

  const clearQuestion = useCallback(() => {
    setQuestion('');
  }, []);

  return {
    question,
    setQuestion,
    clearQuestion,
  };
}
export function checkAnswer(type: string, submitted: string, question: any): boolean {
  const cleanSubmitted = (submitted || '').trim().toUpperCase();
  
  // Extract correct answer value from answerData or correctAnswer fallback
  let correctVal = '';
  if (question.answerData) {
    if (typeof question.answerData === 'string') {
      correctVal = question.answerData;
    } else if (typeof question.answerData === 'object' && (question.answerData as any).value !== undefined) {
      correctVal = String((question.answerData as any).value);
    } else {
      correctVal = JSON.stringify(question.answerData);
    }
  } else {
    correctVal = question.correctAnswer || '';
  }
  
  const cleanCorrect = correctVal.trim().toUpperCase();

  if (type === 'MULTIPLE_CHOICE' || type === 'TRUE_FALSE') {
    return cleanSubmitted === cleanCorrect;
  }
  
  if (type === 'FILL_BLANK') {
    const subNum = parseFloat(cleanSubmitted);
    const corrNum = parseFloat(cleanCorrect);
    if (!isNaN(subNum) && !isNaN(corrNum)) {
      return subNum === corrNum;
    }
    return cleanSubmitted === cleanCorrect;
  }

  if (type === 'SELECT_MULTIPLE' || type === 'DRAG_ORDER') {
    if (type === 'SELECT_MULTIPLE') {
      const subKeys = cleanSubmitted.split(',').map(k => k.trim()).filter(Boolean).sort().join(',');
      const corrKeys = cleanCorrect.split(',').map(k => k.trim()).filter(Boolean).sort().join(',');
      return subKeys === corrKeys;
    }
    return cleanSubmitted === cleanCorrect;
  }

  if (type === 'MATCH_PAIR') {
    try {
      const subObj = JSON.parse(submitted);
      const corrObj = typeof question.answerData === 'string' 
        ? JSON.parse(question.answerData) 
        : question.answerData;
      
      const subKeys = Object.keys(subObj).sort();
      const corrKeys = Object.keys(corrObj).sort();
      
      if (subKeys.length !== corrKeys.length) return false;
      
      for (const k of subKeys) {
        const corrKey = corrKeys.find(ck => ck.trim().toUpperCase() === k.trim().toUpperCase());
        if (!corrKey) return false;
        
        const subVal = String(subObj[k]).trim().toUpperCase();
        const corrVal = String(corrObj[corrKey]).trim().toUpperCase();
        if (subVal !== corrVal) return false;
      }
      return true;
    } catch (e) {
      return cleanSubmitted === cleanCorrect;
    }
  }

  return cleanSubmitted === cleanCorrect;
}

export function getCorrectAnswerString(question: any): string {
  if (question.answerData) {
    if (typeof question.answerData === 'string') {
      return question.answerData;
    } else if (typeof question.answerData === 'object' && (question.answerData as any).value !== undefined) {
      return String((question.answerData as any).value);
    } else {
      return JSON.stringify(question.answerData);
    }
  }
  return question.correctAnswer || '';
}

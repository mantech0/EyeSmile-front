import React from 'react';
import './App.css';
import QuestionnaireContainer from './components/questionnaire/QuestionnaireContainer';

function App(): React.ReactElement {
  return (
    <div className="App">
      <h1>EyeSmile</h1>
      <QuestionnaireContainer />
    </div>
  );
}

export default App; 
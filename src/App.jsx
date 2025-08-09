import { useState, useEffect, useCallback, useRef } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import { generateChallengeFromAI, getAvailableDifficulties, getAvailableTypes } from './challengeGenerator';
import './App.css';

const difficultyLevels = getAvailableDifficulties();
const challengeTypes = getAvailableTypes();

function App() {
  const [challenge, setChallenge] = useState(null);
  const [code, setCode] = useState('');
  const [results, setResults] = useState([]);
  const [syntaxError, setSyntaxError] = useState('');
  
  const [difficulty, setDifficulty] = useState('Easy');
  const [type, setType] = useState('Arrays');
  const [isLoading, setIsLoading] = useState(true);

  const timerRef = useRef(null);
  const [nextChallengeCountdown, setNextChallengeCountdown] = useState(null);

  const loadNewChallenge = useCallback(async (options) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setNextChallengeCountdown(null);
    setIsLoading(true);
    setResults([]);
    setSyntaxError('');

    const newChallenge = await generateChallengeFromAI(options);

    setChallenge(newChallenge);
    setCode(newChallenge.buggyCode || '');
    setIsLoading(false);
  }, []);

  // Effect for initial load and filter changes
  useEffect(() => {
    loadNewChallenge({ difficulty, type });
  }, [difficulty, type, loadNewChallenge]);

  const startNextChallengeTimer = useCallback(() => {
    setNextChallengeCountdown(10);
    timerRef.current = setInterval(() => {
      setNextChallengeCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          const currentDifficultyIndex = difficultyLevels.indexOf(difficulty);
          const nextDifficulty = difficultyLevels[currentDifficultyIndex + 1] || difficulty;
          loadNewChallenge({ difficulty: nextDifficulty, type });
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  }, [difficulty, type, loadNewChallenge]);

  const runTests = () => {
    // Guard against running tests on an empty or error state challenge
    if (!challenge || !challenge.testCases || challenge.testCases.length === 0) return;
    
    setSyntaxError('');
    setResults([]);

    try {
      const userFunction = new Function(`return (${code})`)();
      if (typeof userFunction !== 'function') {
        setSyntaxError('The provided code does not define a valid function.');
        return;
      }

      const testResults = challenge.testCases.map(testCase => {
        const actual = userFunction(...testCase.input);
        return { pass: JSON.stringify(actual) === JSON.stringify(testCase.expected), actual, expected: testCase.expected };
      });
      
      const allPassed = testResults.every(r => r.pass);
      setResults(testResults.map((r, i) => ({
        pass: r.pass,
        text: `Test ${i + 1}: ${r.pass ? 'Pass' : `Fail (Expected: ${JSON.stringify(r.expected)}, Got: ${JSON.stringify(r.actual)})`}`
      })));

      if (allPassed) {
        startNextChallengeTimer();
      }
    } catch (error) {
      setSyntaxError(error.message);
    }
  };
  
  const handleCodeChange = useCallback((value) => { setCode(value); }, []);
  const handleGetNewProblem = () => loadNewChallenge({ difficulty, type });

  // Main render logic
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="loading-container">
          <h2>Generating new challenge from AI...</h2>
          <p>This might take a moment.</p>
        </div>
      );
    }

    // This is the fix: A robust check for a valid challenge object AFTER loading is complete.
    if (!challenge || challenge.error) {
      return (
        <div className="loading-container">
          <h2>{challenge?.title || "An Error Occurred"}</h2>
          <p>{challenge?.description || "Could not load a challenge. Please try different filters or check your API key."}</p>
          <button className="run-button" style={{width: 'auto', marginTop: '20px'}} onClick={handleGetNewProblem}>Try Again</button>
        </div>
      );
    }

    return (
      <main className="App-main">
        <div className="challenge-container">
          <div className="challenge-details">
            <h2>{challenge.title}</h2>
            <p>{challenge.description}</p>
          </div>
          <div className="editor-container">
            <CodeMirror value={code} height="300px" extensions={[javascript({ jsx: true })]} theme={oneDark} onChange={handleCodeChange} />
          </div>
          <button className="run-button" onClick={runTests} disabled={challenge.error}>Run Tests</button>
        </div>
        <div className="output-container">
          {nextChallengeCountdown && (
            <div className="countdown-container">
              <p>Nicely done! Next challenge in {nextChallengeCountdown}s...</p>
            </div>
          )}
          <div className="results-container">
            <h2>Results</h2>
            {results.length > 0 ? <div id="results">{results.map((result, index) => <div key={index} className={result.pass ? 'pass' : 'fail'}>{result.text}</div>)}</div> : <div className="no-results"><p>Click "Run Tests" to see the results.</p></div>}
          </div>
          {syntaxError && <div className="syntax-error-container"><h2>Syntax Error</h2><pre className="error-message">{syntaxError}</pre></div>}
        </div>
      </main>
    );
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>JavaScript Debugging Practice</h1>
        <div className="filters">
            <select value={difficulty} onChange={e => setDifficulty(e.target.value)} disabled={isLoading}>
                {difficultyLevels.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select value={type} onChange={e => setType(e.target.value)} disabled={isLoading}>
                {challengeTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <button onClick={handleGetNewProblem} disabled={isLoading}>Get New Problem</button>
        </div>
      </header>
      {renderContent()}
    </div>
  );
}

export default App;

import { useEffect, useState } from "react";

export const useControls = (type) => {{
  const [forward, setForward] = useState(false);
  const [backward, setBackward] = useState(false);
  const [left, setLeft] = useState(false);
  const [right, setRight] = useState(false);

  useEffect(() => {
    const addKeyboardListeners = () => {
      const handleKeyDown = (event) => {
        switch (event.key) {
          case 'ArrowUp':
            setForward(true);
            break;
          case 'ArrowDown':
            setBackward(true);
            break;
          case 'ArrowLeft':
            setLeft(true);
            break;
          case 'ArrowRight':
            setRight(true);
            break;
          default:
            break;
        }
      };

      const handleKeyUp = (event) => {
        switch (event.key) {
          case 'ArrowUp':
            setForward(false);
            break;
          case 'ArrowDown':
            setBackward(false);
            break;
          case 'ArrowLeft':
            setLeft(false);
            break;
          case 'ArrowRight':
            setRight(false);
            break;
          default:
            break;
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('keyup', handleKeyUp);

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('keyup', handleKeyUp);
      };
    };

    switch (type) {
      case 'KEYS':
        addKeyboardListeners();
        break;
      default:
        break;
    }
  }, [type]);

  return {
    forward,
    backward,
    left,
    right,
  };
}}
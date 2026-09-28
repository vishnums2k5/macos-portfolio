import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";

type CalcOp = "+" | "-" | "×" | "÷";

interface CalcState {
  display: string;
  storedValue: number | null;
  operator: CalcOp | null;
  waitingForOperand: boolean;
  lastOperator: CalcOp | null;
  lastOperand: number | null;
}

const BTN_ROWS = [
  ["clear", "+/-", "%", "÷"],
  ["7", "8", "9", "×"],
  ["4", "5", "6", "-"],
  ["1", "2", "3", "+"],
  ["0", ".", "="],
];

function calculate(a: number, b: number, op: CalcOp): number {
  switch (op) {
    case "+":
      return a + b;
    case "-":
      return a - b;
    case "×":
      return a * b;
    case "÷":
      return b === 0 ? NaN : a / b;
    default:
      return b;
  }
}

function formatResult(num: number): string {
  if (isNaN(num) || !isFinite(num)) return "Error";
  if (Math.abs(num) > 999999999 || (Math.abs(num) < 0.000001 && num !== 0)) {
    return num.toExponential(4).replace("+", "");
  }
  // Remove floating point inaccuracies like 0.1 + 0.2 = 0.30000000000000004
  const rounded = parseFloat(num.toPrecision(10));
  return rounded.toString();
}

function formatDisplay(str: string): string {
  if (str === "Error") return "Error";
  const isNegative = str.startsWith("-");
  const raw = isNegative ? str.slice(1) : str;
  const parts = raw.split(".");
  const intPart = parts[0];
  const decPart = parts[1];

  const formattedInt = (isNegative ? "-" : "") + (intPart === "" ? "0" : Number(intPart).toLocaleString("en-US"));
  if (decPart !== undefined) {
    return `${formattedInt}.${decPart}`;
  }
  return formattedInt;
}

export default function Calculator() {
  const [state, setState] = useState<CalcState>({
    display: "0",
    storedValue: null,
    operator: null,
    waitingForOperand: false,
    lastOperator: null,
    lastOperand: null,
  });

  const clearButtonText = state.display !== "0" && !state.waitingForOperand ? "C" : "AC";

  const handleInputDigit = useCallback((digit: string) => {
    setState((prev) => {
      if (prev.display === "Error" || prev.waitingForOperand) {
        return {
          ...prev,
          display: digit,
          waitingForOperand: false,
        };
      }
      if (prev.display === "0") {
        return {
          ...prev,
          display: digit,
        };
      }
      if (prev.display.replace("-", "").replace(".", "").length >= 9) {
        return prev;
      }
      return {
        ...prev,
        display: prev.display + digit,
      };
    });
  }, []);

  const handleInputDecimal = useCallback(() => {
    setState((prev) => {
      if (prev.display === "Error" || prev.waitingForOperand) {
        return {
          ...prev,
          display: "0.",
          waitingForOperand: false,
        };
      }
      if (!prev.display.includes(".")) {
        return {
          ...prev,
          display: prev.display + ".",
        };
      }
      return prev;
    });
  }, []);

  const handleToggleSign = useCallback(() => {
    setState((prev) => {
      if (prev.display === "0" || prev.display === "Error") return prev;
      if (prev.display.startsWith("-")) {
        return { ...prev, display: prev.display.slice(1) };
      }
      return { ...prev, display: "-" + prev.display };
    });
  }, []);

  const handlePercent = useCallback(() => {
    setState((prev) => {
      if (prev.display === "Error") return prev;
      const cur = parseFloat(prev.display);
      if (isNaN(cur)) return prev;

      // In macOS Calculator: if in the middle of a + or - op, % computes percent of storedValue
      let result: number;
      if (prev.storedValue !== null && (prev.operator === "+" || prev.operator === "-")) {
        result = (prev.storedValue * cur) / 100;
      } else {
        result = cur / 100;
      }
      return {
        ...prev,
        display: formatResult(result),
      };
    });
  }, []);

  const handleClear = useCallback(() => {
    setState((prev) => {
      if (prev.display !== "0" && !prev.waitingForOperand) {
        // Clear Entry (C)
        return {
          ...prev,
          display: "0",
        };
      }
      // All Clear (AC)
      return {
        display: "0",
        storedValue: null,
        operator: null,
        waitingForOperand: false,
        lastOperator: null,
        lastOperand: null,
      };
    });
  }, []);

  const handleOperator = useCallback((nextOp: CalcOp) => {
    setState((prev) => {
      if (prev.display === "Error") {
        return {
          display: "0",
          storedValue: 0,
          operator: nextOp,
          waitingForOperand: true,
          lastOperator: null,
          lastOperand: null,
        };
      }

      const curVal = parseFloat(prev.display);

      if (prev.operator !== null && !prev.waitingForOperand && prev.storedValue !== null) {
        // Chained calculation, e.g. 5 + 3 +
        const intermediate = calculate(prev.storedValue, curVal, prev.operator);
        return {
          display: formatResult(intermediate),
          storedValue: isNaN(intermediate) ? null : intermediate,
          operator: isNaN(intermediate) ? null : nextOp,
          waitingForOperand: true,
          lastOperator: null,
          lastOperand: null,
        };
      }

      return {
        ...prev,
        storedValue: curVal,
        operator: nextOp,
        waitingForOperand: true,
        lastOperator: null,
        lastOperand: null,
      };
    });
  }, []);

  const handleEquals = useCallback(() => {
    setState((prev) => {
      if (prev.display === "Error") return prev;
      const curVal = parseFloat(prev.display);

      if (prev.operator !== null && prev.storedValue !== null) {
        const result = calculate(prev.storedValue, curVal, prev.operator);
        return {
          display: formatResult(result),
          storedValue: null,
          operator: null,
          waitingForOperand: true,
          lastOperator: prev.operator,
          lastOperand: curVal,
        };
      }

      // Repeated '=' press repeats last operation
      if (prev.lastOperator !== null && prev.lastOperand !== null) {
        const result = calculate(curVal, prev.lastOperand, prev.lastOperator);
        return {
          ...prev,
          display: formatResult(result),
          waitingForOperand: true,
        };
      }

      return prev;
    });
  }, []);

  const handleBackspace = useCallback(() => {
    setState((prev) => {
      if (prev.waitingForOperand || prev.display === "0" || prev.display === "Error") {
        return prev;
      }
      if (prev.display.length === 1 || (prev.display.length === 2 && prev.display.startsWith("-"))) {
        return { ...prev, display: "0" };
      }
      return { ...prev, display: prev.display.slice(0, -1) };
    });
  }, []);

  const handleButton = useCallback(
    (label: string) => {
      if (label === "clear") {
        handleClear();
      } else if (label === "+/-") {
        handleToggleSign();
      } else if (label === "%") {
        handlePercent();
      } else if (["+", "-", "×", "÷"].includes(label)) {
        handleOperator(label as CalcOp);
      } else if (label === "=") {
        handleEquals();
      } else if (label === ".") {
        handleInputDecimal();
      } else {
        handleInputDigit(label);
      }
    },
    [handleClear, handleToggleSign, handlePercent, handleOperator, handleEquals, handleInputDecimal, handleInputDigit]
  );

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea") return;

      if (e.key >= "0" && e.key <= "9") {
        e.preventDefault();
        handleInputDigit(e.key);
      } else if (e.key === "." || e.key === ",") {
        e.preventDefault();
        handleInputDecimal();
      } else if (e.key === "+") {
        e.preventDefault();
        handleOperator("+");
      } else if (e.key === "-") {
        e.preventDefault();
        handleOperator("-");
      } else if (e.key === "*" || e.key === "x" || e.key === "X") {
        e.preventDefault();
        handleOperator("×");
      } else if (e.key === "/") {
        e.preventDefault();
        handleOperator("÷");
      } else if (e.key === "Enter" || e.key === "=") {
        e.preventDefault();
        handleEquals();
      } else if (e.key === "Backspace") {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === "Escape") {
        e.preventDefault();
        handleClear();
      } else if (e.key === "%") {
        e.preventDefault();
        handlePercent();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleInputDigit, handleInputDecimal, handleOperator, handleEquals, handleBackspace, handleClear, handlePercent]);

  const displayedText = formatDisplay(state.display);
  const textLength = displayedText.length;
  const fontSize = textLength > 11 ? "26px" : textLength > 8 ? "34px" : textLength > 6 ? "42px" : "50px";

  const getButtonStyle = (label: string) => {
    const isOperator = ["÷", "×", "-", "+", "="].includes(label);
    const isActiveOp = state.waitingForOperand && state.operator === label;

    if (["clear", "+/-", "%"].includes(label)) {
      return {
        background: "rgba(165, 165, 165, 0.25)",
        color: "#f5f5f7",
        hoverBg: "rgba(165, 165, 165, 0.4)",
      };
    }

    if (isOperator) {
      if (isActiveOp) {
        return {
          background: "#ffffff",
          color: "#ff9f0a",
          hoverBg: "#ffffff",
        };
      }
      return {
        background: "#ff9f0a",
        color: "#ffffff",
        hoverBg: "#ffb340",
      };
    }

    return {
      background: "rgba(255, 255, 255, 0.12)",
      color: "#ffffff",
      hoverBg: "rgba(255, 255, 255, 0.2)",
    };
  };

  return (
    <div
      className="flex flex-col size-full select-none"
      style={{
        background: "rgba(30, 30, 32, 0.95)",
        backdropFilter: "blur(40px)",
        borderRadius: "0 0 12px 12px",
        overflow: "hidden",
      }}
    >
      {/* Display Screen */}
      <div
        className="flex-1 flex items-end justify-end px-4 pb-2"
        style={{ minHeight: "90px", overflow: "hidden" }}
      >
        <motion.span
          key={displayedText}
          initial={{ opacity: 0.8 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.05 }}
          style={{
            color: "#ffffff",
            fontSize,
            fontWeight: 200,
            letterSpacing: "-0.5px",
            textAlign: "right",
            lineHeight: 1.1,
            wordBreak: "break-all",
          }}
        >
          {displayedText}
        </motion.span>
      </div>

      {/* Calculator Keypad */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "1px",
          background: "rgba(0, 0, 0, 0.4)",
          padding: "1px",
        }}
      >
        {BTN_ROWS.map((row, ri) =>
          row.map((btnKey, ci) => {
            const isZero = btnKey === "0";
            const displayLabel = btnKey === "clear" ? clearButtonText : btnKey;
            const style = getButtonStyle(btnKey);

            return (
              <motion.button
                key={`${ri}-${ci}`}
                whileTap={{ scale: 0.94 }}
                onClick={() => handleButton(btnKey)}
                style={{
                  background: style.background,
                  color: style.color,
                  gridColumn: isZero ? "span 2" : "span 1",
                  padding: isZero ? "0 0 0 26px" : "0",
                  height: "56px",
                  border: "none",
                  cursor: "pointer",
                  fontSize: btnKey === "clear" || btnKey === "+/-" ? "18px" : "22px",
                  fontWeight: 300,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: isZero ? "flex-start" : "center",
                  transition: "background 0.12s ease, color 0.12s ease",
                  outline: "none",
                  userSelect: "none",
                }}
              >
                {displayLabel}
              </motion.button>
            );
          })
        )}
      </div>
    </div>
  );
}

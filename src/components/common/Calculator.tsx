"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Delete02Icon } from "hugeicons-react";

interface CalculatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function Calculator({ open, onOpenChange }: CalculatorProps) {
  const [display, setDisplay] = useState("0");
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const handleNumber = (num: string) => {
    if (waitingForOperand) {
      setDisplay(num);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === "0" ? num : display + num);
    }
  };

  const handleDecimal = () => {
    if (waitingForOperand) {
      setDisplay("0.");
      setWaitingForOperand(false);
    } else if (!display.includes(".")) {
      setDisplay(display + ".");
    }
  };

  const handleOperation = (op: string) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const result = calculate(previousValue, inputValue, operation);
      setDisplay(String(result));
      setPreviousValue(result);
    }

    setWaitingForOperand(true);
    setOperation(op);
  };

  const calculate = (prev: number, current: number, op: string): number => {
    switch (op) {
      case "+":
        return prev + current;
      case "-":
        return prev - current;
      case "×":
        return prev * current;
      case "÷":
        return prev / current;
      case "%":
        return (prev * current) / 100;
      default:
        return current;
    }
  };

  const handleEquals = () => {
    const inputValue = parseFloat(display);

    if (operation && previousValue !== null) {
      const result = calculate(previousValue, inputValue, operation);
      setDisplay(String(result));
      setPreviousValue(null);
      setOperation(null);
      setWaitingForOperand(true);
    }
  };

  const handleClear = () => {
    setDisplay("0");
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(false);
  };

  const handleBackspace = () => {
    if (!waitingForOperand) {
      setDisplay(display.length > 1 ? display.slice(0, -1) : "0");
    }
  };

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") {
        e.preventDefault();
        handleNumber(e.key);
      } else if (e.key === ".") {
        e.preventDefault();
        handleDecimal();
      } else if (e.key === "+" || e.key === "-" || e.key === "*" || e.key === "/") {
        e.preventDefault();
        handleOperation(e.key === "*" ? "×" : e.key === "/" ? "÷" : e.key);
      } else if (e.key === "Enter" || e.key === "=") {
        e.preventDefault();
        handleEquals();
      } else if (e.key === "Escape") {
        e.preventDefault();
        onOpenChange(false);
      } else if (e.key === "Backspace") {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === "c" || e.key === "C") {
        e.preventDefault();
        handleClear();
      } else if (e.key === "%") {
        e.preventDefault();
        handleOperation("%");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, display, previousValue, operation, waitingForOperand]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[320px] p-4 border-2 border-neutral-300 dark:border-neutral-600">
        <DialogHeader>
          <DialogTitle>Calculadora</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* Display */}
          <div className="bg-neutral-100 dark:bg-neutral-900 rounded-lg p-4 text-right">
            <div className="text-xs text-neutral-500 h-4">
              {previousValue !== null && operation && `${previousValue} ${operation}`}
            </div>
            <div className="text-2xl font-semibold truncate">{display}</div>
          </div>

          {/* Buttons */}
          <div className="grid grid-cols-4 gap-2">
            <Button
              variant="outline"
              className="h-12 text-sm bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-white"
              onClick={handleClear}
            >
              C
            </Button>
            <Button
              variant="outline"
              className="h-12 text-sm bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-white"
              onClick={handleBackspace}
            >
              <Delete02Icon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-12 text-sm bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-white"
              onClick={() => handleOperation("%")}
            >
              %
            </Button>
            <Button
              variant="outline"
              className="h-12 text-sm bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-white"
              onClick={() => handleOperation("÷")}
            >
              ÷
            </Button>

            <Button variant="outline" className="h-12 bg-white dark:bg-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-600 border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-white" onClick={() => handleNumber("7")}>7</Button>
            <Button variant="outline" className="h-12 bg-white dark:bg-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-600 border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-white" onClick={() => handleNumber("8")}>8</Button>
            <Button variant="outline" className="h-12 bg-white dark:bg-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-600 border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-white" onClick={() => handleNumber("9")}>9</Button>
            <Button
              variant="outline"
              className="h-12 text-sm bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-white"
              onClick={() => handleOperation("×")}
            >
              ×
            </Button>

            <Button variant="outline" className="h-12 bg-white dark:bg-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-600 border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-white" onClick={() => handleNumber("4")}>4</Button>
            <Button variant="outline" className="h-12 bg-white dark:bg-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-600 border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-white" onClick={() => handleNumber("5")}>5</Button>
            <Button variant="outline" className="h-12 bg-white dark:bg-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-600 border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-white" onClick={() => handleNumber("6")}>6</Button>
            <Button
              variant="outline"
              className="h-12 text-sm bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-white"
              onClick={() => handleOperation("-")}
            >
              -
            </Button>

            <Button variant="outline" className="h-12 bg-white dark:bg-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-600 border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-white" onClick={() => handleNumber("1")}>1</Button>
            <Button variant="outline" className="h-12 bg-white dark:bg-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-600 border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-white" onClick={() => handleNumber("2")}>2</Button>
            <Button variant="outline" className="h-12 bg-white dark:bg-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-600 border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-white" onClick={() => handleNumber("3")}>3</Button>
            <Button
              variant="outline"
              className="h-12 text-sm bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-white"
              onClick={() => handleOperation("+")}
            >
              +
            </Button>

            <Button
              variant="outline"
              className="h-12 col-span-2 bg-white dark:bg-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-600 border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-white"
              onClick={() => handleNumber("0")}
            >
              0
            </Button>
            <Button variant="outline" className="h-12 bg-white dark:bg-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-600 border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-white" onClick={handleDecimal}>.</Button>
            <Button
              className="h-12 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleEquals}
            >
              =
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { useEffect, useRef } from "react";
import { Bold, Italic, Underline, List, ListOrdered, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type RichTextEditorProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

const COMMANDS = [
  { icon: Bold, label: "Bold", command: "bold" },
  { icon: Italic, label: "Italic", command: "italic" },
  { icon: Underline, label: "Underline", command: "underline" },
];

const LIST_COMMANDS = [
  { icon: List, label: "Bullet list", command: "insertUnorderedList" },
  { icon: ListOrdered, label: "Numbered list", command: "insertOrderedList" },
];

export const RichTextEditor = ({ id, value, onChange, placeholder, className }: RichTextEditorProps) => {
  const editorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value]);

  const handleInput = () => {
    const html = editorRef.current?.innerHTML ?? "";
    onChange(html);
  };

  const exec = (command: string) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(command, false, undefined);
    handleInput();
  };

  const handleResetFormatting = () => {
    if (!editorRef.current) return;
    const plainText = editorRef.current.textContent ?? "";
    editorRef.current.innerHTML = plainText;
    onChange(plainText);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap gap-2 rounded-md border border-input bg-muted/40 p-2">
        {COMMANDS.map(({ icon: Icon, label, command }) => (
          <Button
            key={command}
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => exec(command)}
            title={label}
            aria-label={label}
          >
            <Icon className="h-4 w-4" />
          </Button>
        ))}
        <div className="h-6 w-px bg-border" aria-hidden="true" />
        {LIST_COMMANDS.map(({ icon: Icon, label, command }) => (
          <Button
            key={command}
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => exec(command)}
            title={label}
            aria-label={label}
          >
            <Icon className="h-4 w-4" />
          </Button>
        ))}
        <div className="h-6 w-px bg-border" aria-hidden="true" />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleResetFormatting}
          title="Clear formatting"
          aria-label="Clear formatting"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      <div
        id={id}
        ref={editorRef}
        className="rich-text-editor min-h-[160px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20"
        contentEditable
        role="textbox"
        aria-multiline="true"
        data-placeholder={placeholder}
        onInput={handleInput}
        onBlur={handleInput}
        suppressContentEditableWarning
      />
      <p className="text-xs text-muted-foreground">
        Use the toolbar to format text. Paste from external editors will retain basic formatting.
      </p>
    </div>
  );
};

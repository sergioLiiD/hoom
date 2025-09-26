import { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const ChatFilter = ({ onPromptSubmit }) => {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (prompt.trim()) {
      onPromptSubmit(prompt);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 p-4 border-b">
      <Input
        type="text"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Ej: 'casas con más de 3 habitaciones y 2 baños por menos de $2,000,000'"
        className="flex-grow"
      />
      <Button type="submit">Enviar</Button>
    </form>
  );
};

export default ChatFilter;

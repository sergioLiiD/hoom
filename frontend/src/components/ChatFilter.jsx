import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Home, Trees, Building2, Search } from 'lucide-react';

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
      <div className="relative flex-grow">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1 text-muted-foreground">
          <Search className="h-4 w-4" />
        </div>
        <Input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ej: 'casas con más de 3 habitaciones' o 'terrenos de más de 200 m2'"
          className="pl-10 flex-grow"
        />
      </div>
      <div className="flex items-center gap-1 text-xs text-muted-foreground mr-2">
        <Home className="h-3 w-3 text-blue-600" />
        <Trees className="h-3 w-3 text-green-600" />
        <Building2 className="h-3 w-3 text-purple-600" />
      </div>
      <Button type="submit">Buscar</Button>
    </form>
  );
};

export default ChatFilter;

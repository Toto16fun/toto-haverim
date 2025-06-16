
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from 'lucide-react';
import { useFetchGames } from '@/hooks/useFetchGames';

interface FetchGamesButtonProps {
  roundId: string;
  disabled?: boolean;
}

const FetchGamesButton = ({ roundId, disabled = false }: FetchGamesButtonProps) => {
  const fetchGames = useFetchGames();

  const handleFetchGames = () => {
    fetchGames.mutate(roundId);
  };

  return (
    <Button
      onClick={handleFetchGames}
      disabled={disabled || fetchGames.isPending}
      variant="outline"
      className="flex items-center gap-2"
    >
      {fetchGames.isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      {fetchGames.isPending ? 'שולף משחקים...' : 'שלוף משחקים אוטומטית'}
    </Button>
  );
};

export default FetchGamesButton;

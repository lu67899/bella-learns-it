
-- Create trigger for awarding coins when a topic is completed
CREATE TRIGGER award_coins_on_topico_complete
AFTER INSERT ON public.topico_progresso
FOR EACH ROW
EXECUTE FUNCTION public.award_coins_topico();

-- Create trigger for awarding coins when a desafio is answered
CREATE TRIGGER award_coins_on_desafio_resposta
AFTER INSERT ON public.desafio_respostas
FOR EACH ROW
EXECUTE FUNCTION public.award_coins_desafio();

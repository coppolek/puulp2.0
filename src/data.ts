import { Article } from './types';

export const initialArticles: Article[] = [
  {
    id: '1',
    title: 'Il futuro dell\'Intelligenza Artificiale',
    category: 'Tecnologia',
    content: `L'intelligenza artificiale sta evolvendo a un ritmo senza precedenti. Ogni giorno assistiamo a nuove scoperte e applicazioni che promettono di rivoluzionare il nostro modo di vivere e lavorare.

Ma cosa significa questo per il futuro? Molti esperti concordano sul fatto che l'IA non sostituirà l'uomo, ma piuttosto ne potenzierà le capacità.

Immaginate un mondo in cui compiti ripetitivi sono interamente delegati alle macchine, lasciando a noi il tempo per la creatività, la strategia e le relazioni interpersonali.

Tuttavia, esistono sfide etiche significative. La privacy, il bias algoritmico e l'impatto sul mercato del lavoro sono temi che dobbiamo affrontare oggi.

In conclusione, il futuro è promettente ma richiede una guida consapevole. Dobbiamo essere i registi di questo cambiamento, non semplici spettatori.`,
    createdAt: Date.now() - 100000,
  },
  {
    id: '2',
    title: 'Meditazione per principianti',
    category: 'Stile di vita',
    content: `La meditazione non è svuotare la mente, ma osservarla. Spesso crediamo di dover eliminare i pensieri, il che crea solo frustrazione.

Il primo passo è trovare un posto tranquillo. Non servono cuscini costosi o incensi, solo una sedia comoda e cinque minuti del tuo tempo.

Chiudi gli occhi e concentrati sul respiro. Senti l'aria che entra ed esce. Quando la mente vaga, e lo farà, riportala gentilmente al respiro.

La costanza è la chiave. Cinque minuti al giorno sono molto più efficaci di un'ora una volta al mese. Inizia oggi stesso.`,
    createdAt: Date.now() - 50000,
  }
];

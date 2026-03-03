import { v4 as uuidv4 } from 'uuid';

export const seedSongs = [
    {
        id: uuidv4(),
        title: "Legião Urbana - Tempo Perdido",
        artist: "Legião Urbana",
        genre: "Rock Nacional",
        key: "Em",
        bpm: 120,
        capo: 0,
        content: `[Intro] [C] [Am7] [Bm] [Em]

[Verse 1]
[C]Todos os dias [Am7]quando acordo
[Bm]Não tenho mais
[Em]O tempo que passou
[C]Mas tenho muito [Am7]tempo
[Bm]Temos todo o [Em]tempo do mundo

[Verse 2]
[C]Todos os dias [Am7]antes de dormir
[Bm]Lembro e [Em]esqueço como foi o dia
[C]Sempre em frente [Am7]
[Bm]Não temos [Em]tempo a perder

[Chorus]
[C]Nosso [Am7]suor sagrado
[Bm]É bem mais [Em]belo que esse sangue amargo
[C]E tão [Am7]sério
[Bm]E sel[Em]vagem! [C] [Am7] [Bm] [Em]`,
        lastEdited: new Date().toISOString()
    },
    {
        id: uuidv4(),
        title: "Evidências",
        artist: "Chitãozinho & Xororó",
        genre: "Sertanejo",
        key: "E",
        bpm: 70,
        capo: 0,
        content: `[Intro] [E] [A] [B7] [E] [A] [B7]

[Verse 1]
Quando eu [E]digo que deixei de te amar
É por[G#m]que eu te amo
Quando eu [A]digo que não quero mais você
É por[B7]que eu te quero
Eu tenho [E]medo de te dar meu coração
E con[G#m]fessar que eu estou em tuas mãos
Mas não [A]posso imaginar
O que vai [F#m]ser de mim
Se eu te per[B7]der um dia

[Chorus]
E nessa lou[E]cura de dizer que não te [E7]quero
Vou ne[A]gando as aparências
Disfar[Am]çando as evidências
Mas pra que vi[E]ver fingindo
Se eu não [C#m]posso enganar meu cora[F#m]ção?
Eu [B7]sei que te [E]amo!`,
        lastEdited: new Date().toISOString()
    },
    {
        id: uuidv4(),
        title: "Creep",
        artist: "Radiohead",
        genre: "Rock",
        key: "G",
        bpm: 92,
        capo: 0,
        content: `[Intro]
[G] [B] [C] [Cm]

[Verse 1]
When you were here be[G]fore
Couldn't look you in the [B]eye
You're just like an an[C]gel
Your skin makes me [Cm]cry

[Pre-Chorus]
You float like a fea[G]ther
In a beautiful [B]world
I wish I was spe[C]cial
You're so fuckin' spe[Cm]cial

[Chorus]
But I'm a [G]creep, I'm a [B]weirdo
What the hell am I doin' [C]here?
I don't be[Cm]long here`,
        lastEdited: new Date().toISOString()
    },
    {
        id: uuidv4(),
        title: "Hallelujah",
        artist: "Jeff Buckley",
        genre: "Folk",
        key: "C",
        bpm: 60,
        capo: 0,
        content: `[Intro]
[C] [Am] [C] [Am]

[Verse 1]
I [C]heard there was a [Am]secret chord
That [C]David played, and it [Am]pleased the Lord
But [F]you don't really [G]care for music, [C]do you? [G]
It [C]goes like this, the [F]fourth, the [G]fifth
The [Am]minor fall, the [F]major lift
The [G]baffled king com[E7]posing Halle[Am]lujah

[Chorus]
Halle[F]lujah, Halle[Am]lujah
Halle[F]lujah, Halle[C]lu-[G]u-[C]jah`,
        lastEdited: new Date().toISOString()
    },
    {
        id: uuidv4(),
        title: "Garota de Ipanema",
        artist: "Tom Jobim",
        genre: "Bossa Nova",
        key: "F",
        bpm: 110,
        capo: 0,
        content: `[Verse 1]
[Fmaj7]Olha que coisa mais linda
Mais cheia de graça
É [G13]ela menina
Que vem e que passa
Num [Gm7]doce balanço
Ca[C7b9]minho do [Fmaj7]mar [Gb7b5]

[Verse 2]
[Fmaj7]Moça do corpo dourado
Do sol de Ipanema
O [G13]seu balançado
é mais que um poema
É a [Gm7]coisa mais linda
Que [C7b9]eu já vi pas[Fmaj7]sar`,
        lastEdited: new Date().toISOString()
    }
];

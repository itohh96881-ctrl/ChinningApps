export const trainingSteps = [
    {
        rankId: 1,
        level: "0-1",
        title: "足つきぶら下がり (Feet Supported)",
        description: "まずは足を地面にベタっとつけたままぶら下がります。体重の一部を足に逃がし、フォームを確認しましょう。",
        target: { type: "time", value: 30, unit: "秒" },
        sets: 2,
        rest: 60,
        videoUrl: null
    },
    {
        rankId: 2,
        level: "0-2",
        title: "つま先立ちぶら下がり (Tiptoe Hang)",
        description: "足のサポートをつま先だけに減らします。手にかかる負荷が増えますが、まだ安全に調整できます。",
        target: { type: "time", value: 30, unit: "秒" },
        sets: 2,
        rest: 60,
        videoUrl: null
    },
    {
        rankId: 3,
        level: "0-3",
        title: "ぶら下がり (Dead Hang)",
        description: "足を地面から離し、全体重を腕で支えます。肩をリラックスさせすぎず、少し力を入れた状態を保ちましょう。",
        target: { type: "time", value: 30, unit: "秒" },
        sets: 3,
        rest: 60,
        videoUrl: null
    },
    {
        rankId: 4,
        level: 1,
        title: "斜め懸垂 (Australian Pull-up)",
        description: "低い鉄棒を使い、足を地面につけた状態で体を斜めに引き上げます。",
        target: { type: "count", value: 10, unit: "回" },
        sets: 3,
        rest: 90,
        videoUrl: null
    },
    {
        rankId: 5,
        level: 2,
        title: "ネガティブ懸垂 (Negative Pull-up)",
        description: "ジャンプして一番上の体勢になり、ゆっくりと時間をかけて下ろします。",
        target: { type: "count", value: 5, unit: "回" },
        sets: 3,
        rest: 120,
        videoUrl: null
    },
    {
        rankId: 6,
        level: 3,
        title: "懸垂 (Pull-up)",
        description: "反動を使わずに、顎がバーの上に来るまで引き上げます。",
        target: { type: "count", value: 1, unit: "回" },
        sets: 1,
        rest: 120,
        videoUrl: null
    }
];

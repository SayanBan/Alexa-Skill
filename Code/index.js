/*
 * Copyright 2018-2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * A copy of the License is located at
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */

//
// Alexa Fact Skill - Sample for Beginners
//

// sets up dependencies
const Alexa = require('ask-sdk-core');
const i18n = require('i18next');
const sprintf = require('i18next-sprintf-postprocessor');

function supportsDisplay(handlerInput) {
  var hasDisplay =
    handlerInput.requestEnvelope.context &&
    handlerInput.requestEnvelope.context.System &&
    handlerInput.requestEnvelope.context.System.device &&
    handlerInput.requestEnvelope.context.System.device.supportedInterfaces &&
    handlerInput.requestEnvelope.context.System.device.supportedInterfaces.Display
  return hasDisplay;
}

// core functionality for fact skill
const GetNewFactHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    // checks request type
    return request.type === 'LaunchRequest'
      || (request.type === 'IntentRequest'
        && request.intent.name === 'GetNewFactIntent');
  },
  handle(handlerInput) {
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
    // gets a random fact by assigning an array to the variable
    // the random item from the array will be selected by the i18next library
    // the i18next library is set up in the Request Interceptor
    const randomFact = requestAttributes.t('FACTS');
    // concatenates a standard message with the random fact
    const speakOutput = requestAttributes.t('GET_FACT_MESSAGE') + randomFact;
    
    const data = require('./data/main.json');
    const template = require('./templates/main.json');

    if(supportsDisplay(handlerInput))
    return handlerInput.responseBuilder
      .speak(speakOutput)
      .addDirective({
          type: 'Alexa.Presentation.APL.RenderDocument',
          version: '1.0',
          document: template,
          datasources: data
      })
      .getResponse();
      else
      return handlerInput.responseBuilder
      .speak(speakOutput)
      .withSimpleCard(requestAttributes.t('SKILL_NAME'), randomFact)
      .getResponse();

  },
};

const HelpHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
    return handlerInput.responseBuilder
      .speak(requestAttributes.t('HELP_MESSAGE'))
      .reprompt(requestAttributes.t('HELP_REPROMPT'))
      .getResponse();
  },
};

const FallbackHandler = {
  // The FallbackIntent can only be sent in those locales which support it,
  // so this handler will always be skipped in locales where it is not supported.
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && request.intent.name === 'AMAZON.FallbackIntent';
  },
  handle(handlerInput) {
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
    return handlerInput.responseBuilder
      .speak(requestAttributes.t('FALLBACK_MESSAGE'))
      .reprompt(requestAttributes.t('FALLBACK_REPROMPT'))
      .getResponse();
  },
};

const ExitHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && (request.intent.name === 'AMAZON.CancelIntent'
        || request.intent.name === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
    return handlerInput.responseBuilder
      .speak(requestAttributes.t('STOP_MESSAGE'))
      .getResponse();
  },
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);
    return handlerInput.responseBuilder.getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);
    console.log(`Error stack: ${error.stack}`);
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
    return handlerInput.responseBuilder
      .speak(requestAttributes.t('ERROR_MESSAGE'))
      .reprompt(requestAttributes.t('ERROR_MESSAGE'))
      .getResponse();
  },
};

const LocalizationInterceptor = {
  process(handlerInput) {
    // Gets the locale from the request and initializes i18next.
    const localizationClient = i18n.use(sprintf).init({
      lng: handlerInput.requestEnvelope.request.locale,
      resources: languageStrings,
    });
    // Creates a localize function to support arguments.
    localizationClient.localize = function localize() {
      // gets arguments through and passes them to
      // i18next using sprintf to replace string placeholders
      // with arguments.
      const args = arguments;
      const values = [];
      for (let i = 1; i < args.length; i += 1) {
        values.push(args[i]);
      }
      const value = i18n.t(args[0], {
        returnObjects: true,
        postProcess: 'sprintf',
        sprintf: values,
      });

      // If an array is used then a random value is selected
      if (Array.isArray(value)) {
        return value[Math.floor(Math.random() * value.length)];
      }
      return value;
    };
    // this gets the request attributes and save the localize function inside
    // it to be used in a handler by calling requestAttributes.t(STRING_ID, [args...])
    const attributes = handlerInput.attributesManager.getRequestAttributes();
    attributes.t = function translate(...args) {
      return localizationClient.localize(...args);
    };
  },
};

const skillBuilder = Alexa.SkillBuilders.custom();

exports.handler = skillBuilder
  .addRequestHandlers(
    GetNewFactHandler,
    HelpHandler,
    ExitHandler,
    FallbackHandler,
    SessionEndedRequestHandler,
  )
  .addRequestInterceptors(LocalizationInterceptor)
  .addErrorHandlers(ErrorHandler)
  .withCustomUserAgent('sample/basic-fact/v1')
  .lambda();

// TODO: Replace this data with your own.
// It is organized by language/locale.  You can safely ignore the locales you aren't using.
// Update the name and messages to align with the theme of your skill

const deData = {
  translation: {
    SKILL_NAME: 'Weltraumwissen',
    GET_FACT_MESSAGE: 'Hier sind deine Fakten: ',
    HELP_MESSAGE: 'Du kannst sagen, „Nenne mir einen Fakt über den Weltraum“, oder du kannst „Beenden“ sagen... Wie kann ich dir helfen?',
    HELP_REPROMPT: 'Wie kann ich dir helfen?',
    FALLBACK_MESSAGE: 'Die Weltraumfakten Skill kann dir dabei nicht helfen. Sie kann dir Fakten über den Raum erzählen, wenn du dannach fragst.',
    FALLBACK_REPROMPT: 'Wie kann ich dir helfen?',
    ERROR_MESSAGE: 'Es ist ein Fehler aufgetreten.',
    STOP_MESSAGE: 'Auf Wiedersehen!',
    FACTS:
      [
        'Ein Jahr dauert auf dem Merkur nur 88 Tage.',
        'Die Venus ist zwar weiter von der Sonne entfernt, hat aber höhere Temperaturen als Merkur.',
        'Venus dreht sich entgegen dem Uhrzeigersinn, möglicherweise aufgrund eines früheren Zusammenstoßes mit einem Asteroiden.',
        'Auf dem Mars erscheint die Sonne nur halb so groß wie auf der Erde.',
        'Jupiter hat den kürzesten Tag aller Planeten.',
      ],
  },
};

const dedeData = {
  translation: {
    SKILL_NAME: 'Weltraumwissen auf Deutsch',
  },
};

const enData = {
   translation: {
    SKILL_NAME: 'superhero super Facts',
    GET_FACT_MESSAGE: 'Here\'s your fact: ',
    HELP_MESSAGE: 'You can say tell me a superhero fact, or, you can say exit... What can I help you with?',
    HELP_REPROMPT: 'What can I help you with?',
    FALLBACK_MESSAGE: 'The superhero Facts skill can\'t help you with that.  It can help you discover facts about space if you say tell me a space fact. What can I help you with?',
    FALLBACK_REPROMPT: 'What can I help you with?',
    ERROR_MESSAGE: 'Sorry, an error occurred.',
    STOP_MESSAGE: 'Goodbye!',
    FACTS:
      [
        'Did you spot this cool Thor: Ragnarok Easter Egg? When it was revealed, Thor shouting “He’s a friend from work!” made immense waves on social media. The idea came from a kid visiting the set as part of the Make A Wish foundation, who suggested the line to Hemsworth during a break between takes.friend from work',
        'The films are very vague about how old Natasha Romanov is, only hinting she is old enough to have been raised by the KGB. In the comics however, various medical procedures and bits of biotechnology have allowed her to live for decades. ',
        'Saying “I am Groot” might be one of the easiest actor roles in any film to date, but that’s boring. Not only is every line specific to the situation, Vin Diesel recorded himself saying the line in multiple languages including Afrikaans, Russian, Mandarin, French, Flemish and Spanish. ',
        'In earlier drafts, Henry Pym’s wife, Janet van Dyne was set to appear as the Wasp, an interesting setup as she was one of the original Avengers alongside Hulk, Thor and Iron Man. Her role however was given to Black Widow, likely to reduce clutter as she had been established in Iron Man 2',
        'If it was rather convenient that Nick Fury started looking like Samuel L. Jackson, you might be pleased to learn this was no accident. Creators, Mark Miller and Bryan Hitch came up with the idea without asking him in 2000, and it wasn’t until over a decade later they told him he’d be a lead character in the Marvel Cinematic Universe. Upon hearing, Sam reacted by thanking them for getting him a 10-film movie deal.nick fury',
        'It has been estimated that Black Panther has an estimated net worth of somewhere in the trillions. This makes T’Challa himself only slightly less well-off than the entirety of Sweden which has a nominal GDP of $507 billion.',
        'Bit of random trivia from the wacky days of 1977 – everyone’s favorite knuckle-clawed hunk Wolverine was planned to be a wolverine who mutated into a human. This was indicated by a passing leprechaun only he saw but the story group never followed through with this.',
        'An MCU hook-up? Hear us out before scrambling for the barf bags! Melissa Tomei and Robert Downey Jr. (who played the respective pair in Civil War) knew each other from the 1994 film Only You, and dated for a while',
        'In Captain America: Civil War and Black Panther, we get scenes of T’Challa and his kin from Wakanda speaking in their native tongue. One of the most interesting hidden references in this movie is how the words spoken are a variety of Xhosa, a real language spoken prominently in Zimbabwe and South Africa which are close to where Wakanda is situated in the MCU.',
        'When Steve Rogers steps out of the chamber that transforms him into a superman, Peggy Carter can’t help but examine a shirtless Chris Evans with her hand during Captain America: The First Avenger. This wasn’t scripted, but one of those moments in cinema that simply happened spontaneously and was left in for the authenticity of which it played out. We don’t blame you Peggy, you wouldn’t be the only one.',
        'Here’s an interesting superhero fact some of you probably didn’t know. One of the more famous things about The Incredible Hulk TV show and film series was that Bruce Banner, human identity of the Hulk, was called David Banner in the show. A',
        'Due to Fox owning the X-Men license at the time, various films from Captain America to Civil War needed to rephrase many things. Neither Cap’s shield or Ultron contain a trace of Adamantium (the metal around Wolverine’s bones), every instance of “mutant” is replaced with “enhanced” while Wanda and Peter have more mundane parents than Magneto',
        'Marvel has many great and powerful heroes, and a popular proposal is who is the most powerful. This award could go to the One Above All, an all-powerful all-knowing entity that takes the form of Jack Kirby when interacting with others. A step below him is the Living Tribunal, a cosmic entity charged with keeping all universes in balance who can make stars on supernova on a whim. He got a name-drop as a relic owned by Mordo in 2016’s Doctor Strange.',
        'Both the Mad Titan and Wade Wilson were in love with Death but Thanos ended up winning her over and they even had a baby together (Rot). How? He cursed Deadpool with immortality, preventing him from ever truly dying and being with his sweetheart. Damn, that Thanos is a douche.',
        'It’s a running joke in X Men that Xavier’s School for Gifted Youngsters gets destroyed quite regularly. It has been attacked at least seven times including by Juggernaut, the Skrulls, Onslaught and Phalanx. Most adaptations in the movies, TV shows and video games involve the school coming under attack at least once',
        'According to Stan Lee, it’s Spider-Man, with a hyphen, in order to separate him from Superman who in print, could appear to have a very similar name.',
        'When he first appeared, Bruce Banner would transform into a grey-skinned Hulk. He was made green after the first few issues because when it came to printing comics, the grey tone in the four-colour printing process would come out different every time. Grey Hulk would come back as a smarter, more talkative form who took the alias Joe Fixit.',
        'The Men in Black, the black-suited agents of the acclaimed 1997-2012 film series are by right of ownership Marvel license. The company bought the previous publisher, Malibu, in 1994 but all the films, shows and video games have been Marvel productions. Makes you wonder if Coulson and co. strutting around in polarized shades and black suits is a nod to the men above the system.',
        'In the 1980’s, Marvel held a fan competition, looking for aspiring writers and artists. One fan submitted an idea of a stealth suit for the web-head, engineered by Reed Richards and tailored by Janet van Dyne. The idea didn’t hold but Marvel liked the outfit and offered the fan $220 for it. It was used in the comics and even in movies like 2007’s Spider-Man 3. ',
        'Games Workshop has known to kick up a fuss by bringing the copyright hammer down on anyone using the word “Space Marine.” But Marvel might have outdone their ambition in 1975 when they tried to copyright the word “zombie.” The claim didn’t last as it didn’t take long for the company to realize that such a claim is next to impossible to enforce, and gave up by 1996.',
        'The idea of the X-Men being mutants, an entirely different kind of human homo superior might have been catapulted by a legal loophole. They were always mutants but the import of human figures into the United States starting 1994 was more expensive than importing non-human figures. X-Men action figures produced in China were marketed as ‘mutants’ rather than humans.',
        'The name “Captain Marvel” has an interesting history behind it. In 1967, Marvel learned that DC planned to revive Fawcett’s Captain Marvel from the ’40s. DC were beaten to the punch and had to bill him as Shazam, but Marvel is now obligated to keep printing Captain Marvel stories or they lose the right to use him/her to DC. ',
        'It sounds like something from a movie: You’re in bed one evening chilling out by browsing your social media feed when boom! You see your face on some big company’s page that says you are going places. Tom Holland claimed he went ballistic-nuts when he saw Marvel reveal on their website that he’d be the new Spider-Man.',
        'Marvel could have died four years before it published its first issue. In 1937, its creator Martin Goodman was preparing to return to America from a honeymoon by airship – a very classy mode of travel at the time. However, in a move we’ve all likely made, he was just a little too slow in to booking the seats he wanted. He was lucky as he almost bought two seats aboard the Hindenberg on its fateful journey. Woah.',
        'It’s something of an open secret In Hollywood that sets and props get recycled and reused in other movies to save money. Rarely is it done with cars however, as they are usually loans. Fans of Arrested Development however, might recognize the livery of the stair car at the German airport seen in Civil War as the one popularly used by the Bluth family in the show. That’s just one of the many secret Easter Eggs in Civil War!',
        'These days, it’s somewhat trendy to bash any movie made by DC while almost all MCU movies are praised to the skies. It was a different story back in the 80’s and 90’s when during a dark period of poor comic films, Marvel got the short-end of the poo-stick. Captain America struggled in 1944 and 1996 and a film for The Punisher went straight to video. Don’t believe us? Ask any Marvel fan about 1986’s Howard the Duck and see what they say.',
        'The early 1990’s were really not a fun time for Marvel. Along with a Captain America stinker and the Clone Saga looking rather threatening with its pillow, comic sales in the 90’s plummeted as selling old collections became popular. By 1996, shares in Marvel dropped from $35 to just $2. Barely more than the shelf price of the comics they printed.',
        'It’s tough to safeguard spoilers these days when the internet is so ubiquitous. The plan for Infinity War appears to be going the way of Greek Fire by making sure that Tom Holland (the youngest and most likely to talk cast member) doesn’t have access to the entire script. Here’s a funny video showing Benedict Cumberbatch continuously stopping Tom from spoiling the movie. Poor dude!',
        'How do you prepare in just a few months what looks like something that would take a lifetime? You hire the experts! In his preparation for the role of master archer and Shield super-agent Hawkeye, Jeremy Renner trained with Olympic archers to understand how to shoot a bow. A playlist suited to the role is another trick of his.',
        'There were multiple versions of Steve’s “catch-up” list in Winter Soldier which would list icons of pop culture for whatever country the film was playing in. For Australians, his list contained Steve Irwin and Skippy for French viewers, “Fifth Element” was spotted while for the U.K, The Beatles and World Cup Final (1966) were pending on his list!',
        'It’s kind of difficult to imagine an Iron Man not played by Robert Downey Jr. but that almost happened had Jon Favreau not insisted. The drug and alcohol habits that nailed him the role were initially a red flag for Marvel producers when Iron Man was being made',
        'From concept to final execution, it took James Gunn and the Guardians of the Galaxy Vol. 2 team two whole years to plan and create Baby Groot’s dance to Electric Light Orchestra’s hit Mr Blue Sky. This mammoth project (that totally paid off) included Gunn having his producer film him busting some moves.',
        'He’s famous for reinventing the fantasy genre and enjoying a higher fictional body count than Joss Whedon, but George R. R. Martin was an avid fan of Marvel to the point where he wrote in to Marvel’s letter columns in the ’60s. He was particularly fond of the Fantastic Four.',
      ],
  },
};

const enauData = {
  translation: {
    SKILL_NAME: 'Australian Space Facts',
  },
};

const encaData = {
  translation: {
    SKILL_NAME: 'Canadian Space Facts',
  },
};

const engbData = {
  translation: {
    SKILL_NAME: 'British Space Facts',
  },
};

const eninData = {
  translation: {
    SKILL_NAME: 'superhero super Facts',
  },
};

const enusData = {
  translation: {
    SKILL_NAME: 'American Space Facts',
  },
};

const esData = {
  translation: {
    SKILL_NAME: 'Curiosidades del Espacio',
    GET_FACT_MESSAGE: 'Aquí está tu curiosidad: ',
    HELP_MESSAGE: 'Puedes decir dime una curiosidad del espacio o puedes decir salir... Cómo te puedo ayudar?',
    HELP_REPROMPT: 'Como te puedo ayudar?',
    FALLBACK_MESSAGE: 'La skill Curiosidades del Espacio no te puede ayudar con eso.  Te puede ayudar a descubrir curiosidades sobre el espacio si dices dime una curiosidad del espacio. Como te puedo ayudar?',
    FALLBACK_REPROMPT: 'Como te puedo ayudar?',
    ERROR_MESSAGE: 'Lo sentimos, se ha producido un error.',
    STOP_MESSAGE: 'Adiós!',
    FACTS:
        [
          'Un año en Mercurio es de solo 88 días',
          'A pesar de estar más lejos del Sol, Venus tiene temperaturas más altas que Mercurio',
          'En Marte el sol se ve la mitad de grande que en la Tierra',
          'Jupiter tiene el día más corto de todos los planetas',
          'El sol es una esféra casi perfecta',
        ],
  },
};

const esesData = {
  translation: {
    SKILL_NAME: 'Curiosidades del Espacio para España',
  },
};

const esmxData = {
  translation: {
    SKILL_NAME: 'Curiosidades del Espacio para México',
  },
};

const frData = {
  translation: {
    SKILL_NAME: 'Anecdotes de l\'Espace',
    GET_FACT_MESSAGE: 'Voici votre anecdote : ',
    HELP_MESSAGE: 'Vous pouvez dire donne-moi une anecdote, ou, vous pouvez dire stop... Comment puis-je vous aider?',
    HELP_REPROMPT: 'Comment puis-je vous aider?',
    FALLBACK_MESSAGE: 'La skill des anecdotes de l\'espace ne peux vous aider avec cela. Je peux vous aider à découvrir des anecdotes sur l\'espace si vous dites par exemple, donne-moi une anecdote. Comment puis-je vous aider?',
    FALLBACK_REPROMPT: 'Comment puis-je vous aider?',
    ERROR_MESSAGE: 'Désolé, une erreur est survenue.',
    STOP_MESSAGE: 'Au revoir!',
    FACTS:
        [
          'Une année sur Mercure ne dure que 88 jours.',
          'En dépit de son éloignement du Soleil, Vénus connaît des températures plus élevées que sur Mercure.',
          'Sur Mars, le Soleil apparaît environ deux fois plus petit que sur Terre.',
          'De toutes les planètes, Jupiter a le jour le plus court.',
          'Le Soleil est une sphère presque parfaite.',
        ],
  },
};

const frfrData = {
  translation: {
    SKILL_NAME: 'Anecdotes françaises de l\'espace',
  },
};

const itData = {
  translation: {
    SKILL_NAME: 'Aneddoti dallo spazio',
    GET_FACT_MESSAGE: 'Ecco il tuo aneddoto: ',
    HELP_MESSAGE: 'Puoi chiedermi un aneddoto dallo spazio o puoi chiudermi dicendo "esci"... Come posso aiutarti?',
    HELP_REPROMPT: 'Come posso aiutarti?',
    FALLBACK_MESSAGE: 'Non posso aiutarti con questo. Posso aiutarti a scoprire fatti e aneddoti sullo spazio, basta che mi chiedi di dirti un aneddoto. Come posso aiutarti?',
    FALLBACK_REPROMPT: 'Come posso aiutarti?',
    ERROR_MESSAGE: 'Spiacenti, si è verificato un errore.',
    STOP_MESSAGE: 'A presto!',
    FACTS:
      [
        'Sul pianeta Mercurio, un anno dura solamente 88 giorni.',
        'Pur essendo più lontana dal Sole, Venere ha temperature più alte di Mercurio.',
        'Su Marte il sole appare grande la metà che su la terra. ',
        'Tra tutti i pianeti del sistema solare, la giornata più corta è su Giove.',
        'Il Sole è quasi una sfera perfetta.',
      ],
  },
};

const ititData = {
  translation: {
    SKILL_NAME: 'Aneddoti dallo spazio',
  },
};

const jpData = {
  translation: {
    SKILL_NAME: '日本語版豆知識',
    GET_FACT_MESSAGE: '知ってましたか？',
    HELP_MESSAGE: '豆知識を聞きたい時は「豆知識」と、終わりたい時は「おしまい」と言ってください。どうしますか？',
    HELP_REPROMPT: 'どうしますか？',
    ERROR_MESSAGE: '申し訳ありませんが、エラーが発生しました',
    STOP_MESSAGE: 'さようなら',
    FACTS:
      [
        '水星の一年はたった88日です。',
        '金星は水星と比べて太陽より遠くにありますが、気温は水星よりも高いです。',
        '金星は反時計回りに自転しています。過去に起こった隕石の衝突が原因と言われています。',
        '火星上から見ると、太陽の大きさは地球から見た場合の約半分に見えます。',
        '木星の<sub alias="いちにち">1日</sub>は全惑星の中で一番短いです。',
        '天の川銀河は約50億年後にアンドロメダ星雲と衝突します。',
      ],
  },
};

const jpjpData = {
  translation: {
    SKILL_NAME: '日本語版豆知識',
  },
};

const ptbrData = {
  translation: {
    SKILL_NAME: 'Fatos Espaciais',
  },
};

const ptData = {
  translation: {
    SKILL_NAME: 'Fatos Espaciais',
    GET_FACT_MESSAGE: 'Aqui vai: ',
    HELP_MESSAGE: 'Você pode me perguntar por um fato interessante sobre o espaço, ou, fexar a skill. Como posso ajudar?',
    HELP_REPROMPT: 'O que vai ser?',
    FALLBACK_MESSAGE: 'A skill fatos espaciais não tem uma resposta para isso. Ela pode contar informações interessantes sobre o espaço, é só perguntar. Como posso ajudar?',
    FALLBACK_REPROMPT: 'Eu posso contar fatos sobre o espaço. Como posso ajudar?',
    ERROR_MESSAGE: 'Desculpa, algo deu errado.',
    STOP_MESSAGE: 'Tchau!',
    FACTS:
      [
        'Um ano em Mercúrio só dura 88 dias.',
        'Apesar de ser mais distante do sol, Venus é mais quente que Mercúrio.',
        'Visto de marte, o sol parece ser metade to tamanho que nós vemos da terra.',
        'Júpiter tem os dias mais curtos entre os planetas no nosso sistema solar.',
        'O sol é quase uma esfera perfeita.',
      ],
  },
};

// constructs i18n and l10n data structure
const languageStrings = {
  'de': deData,
  'de-DE': dedeData,
  'en': enData,
  'en-AU': enauData,
  'en-CA': encaData,
  'en-GB': engbData,
  'en-IN': eninData,
  'en-US': enusData,
  'es': esData,
  'es-ES': esesData,
  'es-MX': esmxData,
  'fr': frData,
  'fr-FR': frfrData,
  'it': itData,
  'it-IT': ititData,
  'ja': jpData,
  'ja-JP': jpjpData,
  'pt': ptData,
  'pt-BR': ptbrData,
};

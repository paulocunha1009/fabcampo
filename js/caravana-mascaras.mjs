// Ilustrações derivadas da referência fornecida, com auxílio de IA.
// As âncoras normalizadas vêm das aberturas transparentes dos olhos.
const dados=[
  {
    "id": "punu",
    "nome": "Punu",
    "arquivo": "punu-v1.webp",
    "olhos": [
      {
        "x": 0.3627252179528576,
        "y": 0.6232468882727702
      },
      {
        "x": 0.631360390352995,
        "y": 0.6229704852728151
      }
    ],
    "info": "Ilustração digital adaptada da referência fornecida para a Caravana Afro. O nome segue a prancha recebida; a contextualização cultural está em revisão."
  },
  {
    "id": "dan",
    "nome": "Dan",
    "arquivo": "dan-v1.webp",
    "olhos": [
      {
        "x": 0.3162265550419966,
        "y": 0.3935853337236534
      },
      {
        "x": 0.6784854892561736,
        "y": 0.39378305148768017
      }
    ],
    "info": "Ilustração digital adaptada da referência fornecida para a Caravana Afro. O nome segue a prancha recebida; a contextualização cultural está em revisão."
  },
  {
    "id": "baule",
    "nome": "Baule",
    "arquivo": "baule-v1.webp",
    "olhos": [
      {
        "x": 0.3540126762604678,
        "y": 0.5999390279736718
      },
      {
        "x": 0.6391795090563288,
        "y": 0.5999307402482269
      }
    ],
    "info": "Ilustração digital adaptada da referência fornecida para a Caravana Afro. O nome segue a prancha recebida; a contextualização cultural está em revisão."
  },
  {
    "id": "kanaga",
    "nome": "Kanaga (Dogon)",
    "arquivo": "kanaga-v1.webp",
    "olhos": [
      {
        "x": 0.38052558939620224,
        "y": 0.5404719862827035
      },
      {
        "x": 0.6060933664202887,
        "y": 0.5409348939448876
      }
    ],
    "info": "Ilustração digital adaptada da referência fornecida para a Caravana Afro. O nome segue a prancha recebida; a contextualização cultural está em revisão."
  },
  {
    "id": "mwana-pwo",
    "nome": "Mwana Pwo (Chokwe)",
    "arquivo": "mwana-pwo-v1.webp",
    "olhos": [
      {
        "x": 0.323665200152083,
        "y": 0.5733734900210085
      },
      {
        "x": 0.6664865312047994,
        "y": 0.5733823684368978
      }
    ],
    "info": "Ilustração digital adaptada da referência fornecida para a Caravana Afro. O nome segue a prancha recebida; a contextualização cultural está em revisão."
  },
  {
    "id": "bwa",
    "nome": "Bwa",
    "arquivo": "bwa-v1.webp",
    "olhos": [
      {
        "x": 0.3151007584700855,
        "y": 0.3616679636966365
      },
      {
        "x": 0.6747326243598846,
        "y": 0.36158871033031087
      }
    ],
    "info": "Ilustração digital adaptada da referência fornecida para a Caravana Afro. O nome segue a prancha recebida; a contextualização cultural está em revisão."
  },
  {
    "id": "chokwe",
    "nome": "Chokwe",
    "arquivo": "chokwe-v1.webp",
    "olhos": [
      {
        "x": 0.34497359546987333,
        "y": 0.5540114182692307
      },
      {
        "x": 0.6497812689593512,
        "y": 0.5541086161270237
      }
    ],
    "info": "Ilustração digital adaptada da referência fornecida para a Caravana Afro. O nome segue a prancha recebida; a contextualização cultural está em revisão."
  },
  {
    "id": "dogon",
    "nome": "Dogon",
    "arquivo": "dogon-v1.webp",
    "olhos": [
      {
        "x": 0.30985629302699313,
        "y": 0.4869436055672269
      },
      {
        "x": 0.6808736389381909,
        "y": 0.4872882903825717
      }
    ],
    "info": "Ilustração digital adaptada da referência fornecida para a Caravana Afro. O nome segue a prancha recebida; a contextualização cultural está em revisão."
  },
  {
    "id": "yoruba",
    "nome": "Yorubá",
    "arquivo": "yoruba-v1.webp",
    "olhos": [
      {
        "x": 0.33723041946117993,
        "y": 0.4198536184210526
      },
      {
        "x": 0.6596281186393977,
        "y": 0.4202031893004115
      }
    ],
    "info": "Ilustração digital adaptada da referência fornecida para a Caravana Afro. O nome segue a prancha recebida; a contextualização cultural está em revisão."
  }
];
export const mascarasCaravana=dados.map(item=>({...item,imagem:new URL("../img/mascaras/"+item.arquivo,import.meta.url).href}));
export const arteMascara=index=>mascarasCaravana[index]?.imagem||mascarasCaravana[0].imagem;

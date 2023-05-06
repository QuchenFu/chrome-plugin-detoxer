async function filtertoxicity() {
  async function checkToxicity(human_data) {
    const response = await fetch("https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(human_data),
    });
    const data = await response.json();
    return data;
  }

  document.body.contentEditable = true;
  const range = document.createRange();
  range.selectNodeContents(document.body);

  // Filter the range to only select natural language text nodes
  const naturalLanguageNodes = [];
  const nodeIterator = document.createNodeIterator(
    range.commonAncestorContainer,
    NodeFilter.SHOW_TEXT
  );
  let currentNode;
  while ((currentNode = nodeIterator.nextNode())) {
    if (
      currentNode.parentElement.matches(
        'p, h1, h2, h3, h4, h5, h6, li, dt, dd, figcaption, caption, br, td'
      ) &&
      /\S/.test(currentNode.nodeValue)
    ) {
      naturalLanguageNodes.push(currentNode);
    }
  }

  // Build an array of the natural language text
  const naturalLanguage = naturalLanguageNodes.map(node => ({
    node,
    text: node.textContent.trim(),
  }));
  // Clear any existing selections
  window.getSelection().removeAllRanges();

  // Select the natural language nodes
  const naturalLanguageRange = document.createRange();
  for (let node of naturalLanguageNodes) {
    naturalLanguageRange.selectNodeContents(node);
    window.getSelection().addRange(naturalLanguageRange);
  }
  for (let i = 0; i < naturalLanguage.length; i++) {
    const text = naturalLanguage[i].text;
    const node = naturalLanguage[i].node;
    if (text.length > 30) {
      const human_data = {
        comment: {
          text: node.textContent.trim(),
        },
        requestedAttributes: {
          TOXICITY: {},
          INSULT: {},
          // SEVERE_TOXICITY: {},
          IDENTITY_ATTACK: {},
          // PROFANITY: {},
          // THREAT: {}
        },
      };
      const attributeColors = {
        TOXICITY: "yellow",
        INSULT: "red",
        // SEVERE_TOXICITY: "red",
        IDENTITY_ATTACK: "green",
        // PROFANITY: "brown",
        // THREAT: "green"
      };
      
      const ans = await checkToxicity(human_data);
      for (const attribute in ans.attributeScores) {
        const summaryScore = ans.attributeScores[attribute].summaryScore.value;
        if (summaryScore > 0.2) {
          node.textContent = "";
          // node.parentEliment.style.color = attributeColors[attribute];
        }
      }
      console.log(text, ans);
    }
  }
}

chrome.action.onClicked.addListener((tab) => {
  if (!tab.url.includes('chrome://')) {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: filtertoxicity,
    });
  }
});
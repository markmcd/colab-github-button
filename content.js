const processedRows = new Set(); // Track processed file rows

function addColabButtonToNotebookView() {
  const buttonContainer = document.querySelector('.react-blob-header-edit-and-raw-actions');
  if (!buttonContainer) {
    return;
  }

  const existingButton = buttonContainer.querySelector('.colab-button');

  const [_, owner, repo, , branch, ...filePathParts] = window.location.pathname.split('/');
  const filePath = filePathParts.join('/');

  if (!filePath.endsWith('.ipynb')) {
    if (existingButton) {
      existingButton.remove();
    }
    return;
  }

  // If we are here, it's a notebook file so remove the old button.
  if (existingButton) {
    existingButton.remove();
  }

  const colabUrl = `https://colab.research.google.com/no-dogfood/github/${owner}/${repo}/blob/${branch}/${filePath}`;

  const button = document.createElement('button');
  button.textContent = 'Open in Colab';
  button.classList.add('btn', 'btn-sm', 'colab-button');

  button.addEventListener('click', () => {
    window.open(colabUrl, '_blank');
  });

  buttonContainer.appendChild(button);
}

function addColabButtonsToPullRequest() {
  const fileRows = document.querySelectorAll('.file-header[data-path$=".ipynb"]');

  if (fileRows.length == 0) {
    processedRows.clear();
    return;
  }

  fileRows.forEach((row) => {
    const rowId = window.location.href + '#' + row.getAttribute('data-path');

    if (processedRows.has(rowId)) {
      return;
    }

    processedRows.add(rowId);

    if (row.querySelector('.colab-button')) {
      return;
    }

    const filePath = row.getAttribute('data-path');
    const prUrl = window.location.pathname.split('/');
    const prNumber = prUrl[4];

    fetch(`https://api.github.com/repos/${prUrl[1]}/${prUrl[2]}/pulls/${prNumber}`)
      .then((response) => response.json())
      .then((data) => {
        const sourceOrg = data.head.repo.owner.login;
        const sourceRepo = data.head.repo.name;
        const sourceBranch = data.head.ref;

        const colabUrl = `https://colab.research.google.com/no-dogfood/github/${sourceOrg}/${sourceRepo}/blob/${sourceBranch}/${filePath}`;

        const button = document.createElement('button');
        button.textContent = 'Open in Colab';
        button.classList.add('btn', 'btn-sm', 'colab-button');
        button.style.marginLeft = '10px';

        button.addEventListener('click', () => {
          window.open(colabUrl, '_blank');
        });

        row.appendChild(button);
      })
      .catch((error) => {
        console.error('Error fetching pull request details:', error);
      });
  });
}

function addColabButtons() {
  if (window.location.pathname.includes('/blob/')) {
    addColabButtonToNotebookView();
  } else if (window.location.pathname.includes('/pull/')) {
    addColabButtonsToPullRequest();
  }
}

// Disconnect the observer while making changes, to prevent looping.
const observerCallback = (mutationsList, observer) => {
  observer.disconnect();
  addColabButtons();
  observer.observe(document.body, { childList: true, subtree: true });
};

const observer = new MutationObserver(observerCallback);

// Run once on initial page load (for direct page loads).
addColabButtons();

// Start observing the target node for configured mutations (for partial page
// updates).
observer.observe(document.body, { childList: true, subtree: true });


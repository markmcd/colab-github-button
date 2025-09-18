const processedRows = new Set(); // Track processed file rows

function addColabButtons() {
  // console.log('Adding colab buttons, maybe');
  const fileRows = document.querySelectorAll('.file-header[data-path$=".ipynb"]');

  if (fileRows.length == 0) {
    // console.log('No files found, assuming we have navigated elsewhere.');
    processedRows.clear();
    return;
  }

  fileRows.forEach((row) => {
    // Use Repo, PR and file path as unique ID.
    const rowId = window.location.href + '#' + row.getAttribute('data-path');

    if (processedRows.has(rowId)) {
      // console.log('Skipping, already processed.', processedRows);
      return; // Row already processed, skip
    }

    processedRows.add(rowId); // Mark row as processed

    if (row.querySelector('.colab-button')) {
      // console.log('Already has a button, skipping');
      return; // Prevent duplicate buttons from previous runs
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
        // console.log('BUTTON ADDED');
      })
      .catch((error) => {
        console.error('Error fetching pull request details:', error);
      });
  });
}

// Run on page load and on DOM mutations (for dynamic content)
addColabButtons();
const observer = new MutationObserver(addColabButtons);
observer.observe(document.body, { childList: true, subtree: true });


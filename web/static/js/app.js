document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const jdInput = document.getElementById('jdInput');
  const loadSampleJdBtn = document.getElementById('loadSampleJdBtn');
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('fileInput');
  const selectedFileBadge = document.getElementById('selectedFileBadge');
  const selectedFileCount = document.getElementById('selectedFileCount');
  const clearFileBtn = document.getElementById('clearFileBtn');
  const shortlistForm = document.getElementById('shortlistForm');
  const submitBtn = document.getElementById('submitBtn');
  const pipelineStatus = document.getElementById('pipelineStatus');
  const pipelineStepTitle = document.getElementById('pipelineStepTitle');
  const pipelineStepSub = document.getElementById('pipelineStepSub');
  const downloadCsvBtn = document.getElementById('downloadCsvBtn');

  const searchInput = document.getElementById('searchInput');
  const sortSelect = document.getElementById('sortSelect');
  const filterStatusSelect = document.getElementById('filterStatusSelect');
  const clearShortlistBtn = document.getElementById('clearShortlistBtn');
  const candidateTableBody = document.getElementById('candidateTableBody');

  // Modal Elements
  const candidateModal = document.getElementById('candidateModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const closeModalFooterBtn = document.getElementById('closeModalFooterBtn');
  const modalCandidateName = document.getElementById('modalCandidateName');
  const modalCandidateSub = document.getElementById('modalCandidateSub');
  const modalScoreNum = document.getElementById('modalScoreNum');
  const modalStatusPill = document.getElementById('modalStatusPill');
  const modalSummaryReason = document.getElementById('modalSummaryReason');
  const modalMatchingSkillsList = document.getElementById('modalMatchingSkillsList');
  const modalMissingSkillsList = document.getElementById('modalMissingSkillsList');

  let selectedFiles = [];
  let allCandidates = [];

  // Sample JD Loader
  loadSampleJdBtn.addEventListener('click', () => {
    jdInput.value = 
      "Seeking a Software Engineering Intern / Junior Developer.\n" +
      "Requirements:\n" +
      "- Proficiency in React.js, JavaScript, HTML, and CSS.\n" +
      "- Hands-on project experience with Git, GitHub, REST APIs, and database fundamentals.\n" +
      "- Demonstrated problem-solving ability, algorithmic thinking, and clean code practices.\n" +
      "- Open source contributions or personal portfolio projects are a major plus.";
  });

  // Fetch Existing Candidates
  fetchCandidates();

  async function fetchCandidates() {
    try {
      const res = await fetch('/api/candidates');
      const data = await res.json();
      allCandidates = data.candidates || [];
      renderLeaderboard(allCandidates);
    } catch (err) {
      console.error('Error fetching candidate shortlist:', err);
    }
  }

  // Render Table Leaderboard
  function renderLeaderboard(candidates) {
    candidateTableBody.innerHTML = '';

    const query = searchInput.value.toLowerCase().trim();
    const filterStatus = filterStatusSelect.value;
    const sortBy = sortSelect ? sortSelect.value : 'score';

    let filtered = candidates.filter(c => {
      const nameMatch = (c.candidate_name || '').toLowerCase().includes(query) || (c.email || '').toLowerCase().includes(query);
      const statusMatch = filterStatus === 'ALL' || c.status === filterStatus;
      return nameMatch && statusMatch;
    });

    // Sort Candidates
    filtered.sort((a, b) => {
      if (sortBy === 'skills') {
        const skillsA = (a.matching_skills || []).length;
        const skillsB = (b.matching_skills || []).length;
        if (skillsB !== skillsA) return skillsB - skillsA;
      }
      return (b.match_score || 0) - (a.match_score || 0);
    });

    if (filtered.length === 0) {
      candidateTableBody.innerHTML = `<tr><td colspan="7" class="empty-state">No matching candidates in shortlist.</td></tr>`;
      return;
    }

    filtered.forEach((c, idx) => {
      const tr = document.createElement('tr');

      const statusTagClass = c.status === 'Shortlisted' ? 'shortlisted' : 'filtered';
      const pct = (c.match_score || 0).toFixed(0);

      // Rank Medals
      let rankDisplay = `#${idx + 1}`;
      if (idx === 0) rankDisplay = `#1 🥇`;
      else if (idx === 1) rankDisplay = `#2 🥈`;
      else if (idx === 2) rankDisplay = `#3 🥉`;

      // Skill Badges
      const skillsArr = c.matching_skills || [];
      const skillPills = skillsArr.slice(0, 3).map(s => `<span class="status-tag shortlisted" style="margin:2px; font-size:10px;">${s}</span>`).join('');
      const moreCount = skillsArr.length > 3 ? `<span style="font-size:10px; color:var(--text-muted);">+${skillsArr.length - 3} more</span>` : '';

      tr.innerHTML = `
        <td><span class="rank-badge">${rankDisplay}</span></td>
        <td>
          <div class="candidate-name">${c.candidate_name || 'Candidate'}</div>
          <div class="email-sub">${c.email || c.filename || 'PDF Resume'}</div>
        </td>
        <td>
          <div class="score-meter-wrap">
            <span class="score-pct-text">${pct}%</span>
            <div class="meter-bg">
              <div class="meter-fill" style="width: ${Math.min(pct, 100)}%"></div>
            </div>
          </div>
        </td>
        <td>
          <div>${skillPills || '<span style="color:var(--text-muted); font-size:11px;">-</span>'} ${moreCount}</div>
        </td>
        <td>
          <span class="status-tag ${statusTagClass}">${c.status === 'Shortlisted' ? 'Shortlisted ✨' : 'Filtered Out ❌'}</span>
        </td>
        <td>
          <div class="summary-snippet" title="${c.summary_reason || ''}">${c.summary_reason || 'Evaluated against Job Description.'}</div>
        </td>
        <td>
          <button class="btn btn-secondary btn-sm inspect-btn">Inspect Report</button>
        </td>
      `;

      tr.querySelector('.inspect-btn').addEventListener('click', () => {
        openModal(c);
      });

      candidateTableBody.appendChild(tr);
    });
  }

  // Search & Filter & Sort Listeners
  searchInput.addEventListener('input', () => renderLeaderboard(allCandidates));
  filterStatusSelect.addEventListener('change', () => renderLeaderboard(allCandidates));
  if (sortSelect) {
    sortSelect.addEventListener('change', () => renderLeaderboard(allCandidates));
  }
  if (clearShortlistBtn) {
    clearShortlistBtn.addEventListener('click', async () => {
      try {
        await fetch('/api/candidates', { method: 'DELETE' });
        allCandidates = [];
        renderLeaderboard([]);
      } catch (err) {
        console.error('Error clearing candidate shortlist:', err);
      }
    });
  }

  // Multi-File Dropzone Handlers
  dropzone.addEventListener('click', (e) => {
    if (e.target.closest('#clearFileBtn') || e.target.closest('#selectedFileBadge')) return;
    fileInput.click();
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleFilesSelected(Array.from(e.target.files));
    }
  });

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });

  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
      handleFilesSelected(Array.from(e.dataTransfer.files));
    }
  });

  function handleFilesSelected(files) {
    const pdfFiles = files.filter(f => f.name.toLowerCase().endsWith('.pdf'));
    if (pdfFiles.length === 0) {
      alert('Please select valid PDF resume files.');
      return;
    }
    selectedFiles = pdfFiles;
    selectedFileCount.textContent = `${pdfFiles.length} PDF resume file${pdfFiles.length > 1 ? 's' : ''} selected`;
    selectedFileBadge.style.display = 'inline-flex';
  }

  clearFileBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
    selectedFiles = [];
    fileInput.value = '';
    selectedFileBadge.style.display = 'none';
  });

  // Submit Shortlisting Form
  shortlistForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const jdText = jdInput.value.trim();
    if (!jdText) {
      alert('Please paste or enter a Job Description (JD).');
      return;
    }

    if (selectedFiles.length === 0) {
      alert('Please upload at least one candidate PDF resume.');
      return;
    }

    const formData = new FormData();
    formData.append('jd_text', jdText);
    selectedFiles.forEach(file => {
      formData.append('files', file);
    });

    // UI Loading state
    submitBtn.disabled = true;
    pipelineStatus.style.display = 'flex';
    pipelineStepTitle.textContent = `Screening & Ranking ${selectedFiles.length} Resume${selectedFiles.length > 1 ? 's' : ''}...`;
    pipelineStepSub.textContent = 'Matching skills and experience against your Job Description';

    try {
      const res = await fetch('/api/batch-score', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Failed to screen resumes.');
      }

      // Add all new results to candidate leaderboard
      const newCandidates = result.candidates || [];
      allCandidates = [...newCandidates, ...allCandidates];

      renderLeaderboard(allCandidates);

      // Scroll smoothly to leaderboard
      const leaderboardCard = document.querySelector('.leaderboard-card');
      if (leaderboardCard) {
        leaderboardCard.scrollIntoView({ behavior: 'smooth' });
      }

      // Reset file selection
      selectedFiles = [];
      fileInput.value = '';
      selectedFileBadge.style.display = 'none';

    } catch (err) {
      alert('Screening error: ' + err.message);
    } finally {
      submitBtn.disabled = false;
      pipelineStatus.style.display = 'none';
    }
  });

  // Modal Render Logic
  function openModal(candidate) {
    modalCandidateName.textContent = candidate.candidate_name || 'Candidate Evaluation';
    modalCandidateSub.textContent = `${candidate.email || 'No email provided'} • ${candidate.filename || 'PDF Resume'}`;
    
    modalScoreNum.textContent = `${(candidate.match_score || 0).toFixed(0)}%`;
    
    const isShortlisted = candidate.status === 'Shortlisted';
    modalStatusPill.textContent = isShortlisted ? 'Shortlisted ✨' : 'Filtered Out ❌';
    modalStatusPill.className = `status-pill ${isShortlisted ? 'status-tag shortlisted' : 'status-tag filtered'}`;
    
    modalSummaryReason.textContent = candidate.summary_reason || 'Evaluated against custom Job Description criteria.';

    // Matching Skills
    modalMatchingSkillsList.innerHTML = '';
    const matching = candidate.matching_skills || candidate.key_strengths || [];
    if (matching.length === 0) {
      modalMatchingSkillsList.innerHTML = `<li>General qualifications listed.</li>`;
    } else {
      matching.forEach(s => {
        const li = document.createElement('li');
        li.textContent = s;
        modalMatchingSkillsList.appendChild(li);
      });
    }

    // Missing Skills
    modalMissingSkillsList.innerHTML = '';
    const missing = candidate.missing_skills || candidate.areas_for_improvement || [];
    if (missing.length === 0) {
      modalMissingSkillsList.innerHTML = `<li>No critical skill gaps identified.</li>`;
    } else {
      missing.forEach(m => {
        const li = document.createElement('li');
        li.textContent = m;
        modalMissingSkillsList.appendChild(li);
      });
    }

    candidateModal.style.display = 'flex';
  }

  // Close Modal Listeners
  closeModalBtn.addEventListener('click', () => candidateModal.style.display = 'none');
  closeModalFooterBtn.addEventListener('click', () => candidateModal.style.display = 'none');
  candidateModal.addEventListener('click', (e) => {
    if (e.target === candidateModal) candidateModal.style.display = 'none';
  });
});

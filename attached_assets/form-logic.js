// form-logic.js

const MEDICATION_PRICES = {
    semaglutide: 299,
    tirzepatide: 499,
    quickstrips: 120,
    drops: 100
  };
  
  let currentQuestionIndex = 0;
  let formComplete = false;
  const answers = {};
  const checkedItems = {};
  
  const formContainer = document.getElementById("form-container");
  const nextBtn = document.getElementById("next-btn");
  const status = document.getElementById("status");
  
  function calculateBMI(weight, height) {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    if (!w || !h) return 0;
    return (w / (h * h)) * 703;
  }
  
  function renderQuestion() {
    const q = questions[currentQuestionIndex];
    if (!q) return;
  
    formContainer.innerHTML = `<h3>${q.title}</h3>`;
    document.getElementById("paypal-button-container").innerHTML = "";
    nextBtn.style.display = q.type === 'landing' ? 'inline-block' : 'inline-block';
  
    if (q.type === 'text' || q.type === 'email' || q.type === 'tel') {
      formContainer.innerHTML += `<input type="${q.type}" id="${q.id}" />`;
    } else if (q.type === 'radio') {
      q.options.forEach(opt => {
        formContainer.innerHTML += `<label><input type="radio" name="${q.id}" value="${opt.value}" /> ${opt.label}</label><br>`;
      });
    } else if (q.type === 'multiCheckbox') {
      q.checkboxOptions.forEach(opt => {
        formContainer.innerHTML += `<label><input type="checkbox" name="${q.id}" value="${opt.id}" onchange="handleCheckboxChange('${q.id}', '${opt.id}', this.checked)" /> ${opt.label}</label><br>`;
      });
    } else if (q.type === 'textarea') {
      formContainer.innerHTML += `<textarea id="${q.id}"></textarea>`;
    } else if (q.type === 'fileUpload') {
      formContainer.innerHTML += `<input type="file" id="${q.id}" />`;
    }
  }
  
  function handleCheckboxChange(questionId, checkboxId, checked) {
    const currentCheckedItems = { ...(checkedItems[questionId] || {}) };
    if (checkboxId === 'none' && checked) {
      Object.keys(currentCheckedItems).forEach(key => currentCheckedItems[key] = false);
      currentCheckedItems[checkboxId] = true;
    } else if (checked) {
      currentCheckedItems[checkboxId] = true;
      currentCheckedItems['none'] = false;
    } else {
      currentCheckedItems[checkboxId] = false;
    }
    checkedItems[questionId] = currentCheckedItems;
    answers[questionId] = Object.entries(currentCheckedItems).filter(([_, isChecked]) => isChecked).map(([id]) => id);
  }
  
  function collectAnswer() {
    const q = questions[currentQuestionIndex];
    if (q.type === 'text' || q.type === 'email' || q.type === 'tel' || q.type === 'textarea') {
      answers[q.id] = document.getElementById(q.id).value;
    } else if (q.type === 'radio') {
      const selected = document.querySelector(`input[name="${q.id}"]:checked`);
      answers[q.id] = selected ? selected.value : '';
    } else if (q.type === 'fileUpload') {
      const fileInput = document.getElementById(q.id);
      if (fileInput.files.length > 0) {
        const reader = new FileReader();
        reader.onloadend = () => {
          answers[q.id] = reader.result;
        };
        reader.readAsDataURL(fileInput.files[0]);
      }
    }
  
    if (q.type === 'multiCheckbox' && answers[q.id]?.length > 0 && !answers[q.id].includes('none')) {
      if (q.id === 'medicalConditions') {
        status.textContent = '❌ Ineligible due to medical history.';
        nextBtn.style.display = 'none';
        return false;
      } else if (q.id === 'medications') {
        status.textContent = '❌ Ineligible due to medications.';
        nextBtn.style.display = 'none';
        return false;
      }
    }
  
    if (q.id === 'height') {
      const bmi = calculateBMI(answers['weight'], answers['height']);
      answers['bmi'] = bmi.toFixed(1);
      if (bmi < 25) {
        status.textContent = `❌ Your BMI is ${bmi.toFixed(1)}. Ineligible for weight loss treatment.`;
        nextBtn.style.display = 'none';
        return false;
      }
    }
    return true;
  }
  
  nextBtn.addEventListener("click", () => {
    const valid = collectAnswer();
    if (!valid) return;
  
    const q = questions[currentQuestionIndex];
    if (q.id === 'gender' && answers['gender'] === 'male') {
      const skipIndex = questions.findIndex(q => q.id === 'pregnancy');
      if (skipIndex !== -1) currentQuestionIndex = skipIndex + 1;
    } else if (q.id === 'activeIngredient') {
      if (answers[q.id] === 'semaglutide') currentQuestionIndex = questions.findIndex(q => q.id === 'ozempicSchedule');
      else if (answers[q.id] === 'tirzepatide') currentQuestionIndex = questions.findIndex(q => q.id === 'mounjaroSchedule');
    } else if (q.id === 'sublingual_form') {
      if (answers[q.id] === 'quickstrips') currentQuestionIndex = questions.findIndex(q => q.id === 'quickStripsSchedule');
      else if (answers[q.id] === 'drops') currentQuestionIndex = questions.findIndex(q => q.id === 'dropsSchedule');
    } else {
      currentQuestionIndex++;
    }
  
    if (currentQuestionIndex < questions.length) {
      renderQuestion();
    } else {
      formContainer.innerHTML = '<h3>Almost done! Please complete your payment.</h3>';
      nextBtn.style.display = 'none';
      const price = MEDICATION_PRICES[answers['activeIngredient']] || MEDICATION_PRICES[answers['sublingual_form']] || 299;
  
      paypal.Buttons({
        createOrder: (data, actions) => actions.order.create({ purchase_units: [{ amount: { value: price.toFixed(2) } }] }),
        onApprove: (data, actions) => actions.order.capture().then(details => {
          fetch("/submit-form", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...answers, paymentID: details.id })
          })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              currentQuestionIndex = questions.findIndex(q => q.id === 'confirmationPage');
              renderQuestion();
            } else {
              status.textContent = "❌ Submission failed.";
            }
          })
          .catch(() => status.textContent = "⚠️ Network error.");
        })
      }).render('#paypal-button-container');
    }
  });
  
  renderQuestion();
  
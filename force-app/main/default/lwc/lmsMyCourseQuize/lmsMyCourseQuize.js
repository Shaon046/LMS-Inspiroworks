import { LightningElement, track, api } from 'lwc';
import getCourseQuizModules from '@salesforce/apex/LMSQuizController.getCourseQuizModules';
import submitQuizAnswers from '@salesforce/apex/LMSQuizController.submitQuizAnswers';
import getCourseQuizModulesData from '@salesforce/apex/LMSQuizController.getCourseQuizModulesData';
import getCourseQuizModulesAnswers from '@salesforce/apex/LMSQuizController.getCourseQuizModulesAnswers';

export default class LmsMyCourseQuiz extends LightningElement {
  @track currentQuestionIndex = 0;
  @track selectedOption = null;
  @track answers = [];
  @track questions = [];
  @track correctPartAnswers = [];
  @track participantAnswers = [];
  @track participantAnswers;


  displayPass = false;
  displayFail = false;
  showReviewModal = false;
  displayQuiz = true;
  notFailedFinal = false;
  attemptNumber;
  correctAnswers;
  designatedPassingGrade;
  passingGrade;
  quizStatus;
  totalQuestions;
  quizOriginalAnswers;
  isCorrectOrIncorrect;
  courseModulePartId;

  _courseModuleId;

  @api isRetakeFound = false;
  @api isComingAdminViewPage=false;
  @api
  get getCourseModuleId() {
    return this._courseModuleId;
  }

  set getCourseModuleId(value) {
    if (value !== this._courseModuleId) {
      this._courseModuleId = value;
      console.log('Course Module ID updated:', value);
      this.initializeQuiz();
      this.fetchCourseModules(value);
      this.fetchCourseModulesUpdatedData(value);

    }
  }

  initializeQuiz() {
    this.currentQuestionIndex = 0;
    this.selectedOption = null;
    this.answers = [];
    this.questions = [];
    this.showReviewModal = false;
  }

  fetchCourseModules(courseId) {
    this.courseModulePartId = courseId;
    if (!courseId) {
      console.warn('No Course Module ID provided');
      return;
    }
    getCourseQuizModules({ courseId })
      .then((result) => {
        this.quizOriginalAnswers = result;
        console.log('Fetched Quiz Modules:', JSON.stringify(result));
        this.processQuizQuestions(result);
      })
      .catch((error) => {
        console.error('Error fetching course modules:', error);
      });
  }

  processQuizQuestions(modules) {
    if (modules && modules.length > 0) {
      this.questions = modules.flatMap((module) => {
        const quizQuestions = [];

        // Dynamically find max question count based on available fields
        const moduleKeys = Object.keys(module);
        const maxQuestions = moduleKeys
          .filter((key) => key.startsWith('Quiz_Question_'))
          .map((key) => parseInt(key.match(/\d+/)[0], 10))
          .reduce((max, num) => Math.max(max, num), 0);

        console.log(`Detected ${maxQuestions} quiz questions for module.`);

        for (let i = 1; i <= maxQuestions; i++) {
          const questionField = `Quiz_Question_${i}__c`;
          const optionsField = `Other_Optional_Answers_for_Quiz_${i}__c`;
          const correctAnswerField = `Correct_Answer_of_Quiz_${i}__c`;

          if (module[questionField]) {
            const options = module[optionsField]
              ? module[optionsField].split(';').map((text, index) => ({
                id: `${i}-${index + 1}`, // Unique ID for each option
                text: text.trim(),
                dynamicColor: '',
                isChecked: null,
              }))
              : [];

            console.log(`Processing Question ${i}:`, module[questionField]);

            quizQuestions.push({
              question: module[questionField],
              options,
              correctAnswer: module[correctAnswerField] || null,
              selectedAnswer: null,
              isCorrect: null,
              questionNumber: `${i}`,
            });
          }
        }
        return quizQuestions;
      });
    } else {
      console.warn('No quiz modules found.');
    }
  }

  //check copnditions 
  fetchCourseModulesUpdatedData(val) {
    getCourseQuizModulesData({ courseParticipantId: val })
      .then((result) => {
        if (!this.isRetakeFound) {
          this.attemptNumber = result[0].attemptNumber;
          this.correctAnswers = result[0].correctAnswers;
          this.designatedPassingGrade = result[0].designatedPassingGrade;
          this.passingGrade = result[0].passingGrade;
          this.quizStatus = result[0].quizStatus;
          this.totalQuestions = result[0].totalQuestions;
          if (this.quizStatus === 'Passed' && result[0].StatusofCourseModules === 'Completed') {
            console.log('1sssttttttt')
            this.displayQuiz = false;
            this.displayFail = false;
            this.displayPass = true;
          } else if (this.quizStatus === 'Failed' && result[0].StatusofCourseModules === 'Completed') {
            console.log('2sssttttttt')
            this.displayQuiz = false;
            this.displayFail = true;
            this.notFailedFinal = true;
            this.displayPass = false;
          } else if (this.quizStatus === 'Failed Final' && result[0].StatusofCourseModules === 'Completed') {
            console.log('3sssttttttt')
            this.displayQuiz = false;
            this.displayFail = true;
            this.notFailedFinal = false;
            this.displayPass = false;
          } else {
            this.displayPass = false;
            this.displayFail = false;
            this.notFailedFinal = true;
            this.displayQuiz = true;
          }
        }
      })
  }

  get currentQuestion() {
    return this.questions[this.currentQuestionIndex];
  }

  get isFirstQuestion() {
    return this.currentQuestionIndex === 0;
  }

  get isLastQuestion() {
    return this.currentQuestionIndex === this.questions.length - 1;
  }

  get questionProgress() {
    return `${this.currentQuestionIndex + 1} of ${this.questions.length}`;
  }

  get currentOptions() {
    return this.currentQuestion.options.map((option) => ({
      ...option,
      isChecked: this.selectedOption === option.id,
    }));
  }

  handleOptionChange(event) {
    const selectedOptionId = event.target.value;
    console.log('selectedOptionId+++++++', selectedOptionId);
    this.questions[this.currentQuestionIndex].selectedAnswer = selectedOptionId;
    const answerObj = {
      question: this.questions[this.currentQuestionIndex].question,
      selectedAnswer: selectedOptionId
    };

    if (this.answers[this.currentQuestionIndex] === undefined) {
      this.answers[this.currentQuestionIndex] = answerObj;
    } else {
      this.answers[this.currentQuestionIndex] = answerObj;
    }
    console.log(
      `Question: ${this.questions[this.currentQuestionIndex].question}, 
        Selected Answer: ${this.questions[this.currentQuestionIndex].selectedAnswer}`
    );

    console.log(this.questions);
    console.log(this.answers);
  }

  handlePrevious() {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex -= 1;
      this.selectedOption = this.answers[this.currentQuestionIndex]?.selectedAnswer || null;
    }
  }

  handleNext() {
    if (this.currentQuestionIndex < this.questions.length - 1) {
      this.currentQuestionIndex += 1;
      this.selectedOption = this.answers[this.currentQuestionIndex]?.selectedAnswer || null;
    }
  }

  handleSubmit() {
    console.log('Submitted Answers:', JSON.stringify(this.answers));
    submitQuizAnswers({ participantModuleId: this.getCourseModuleId, answers: this.answers })
      .then(result => {
        this.attemptNumber = result.attemptNumber;
        this.correctAnswers = result.correctAnswers;
        this.designatedPassingGrade = result.designatedPassingGrade;
        this.passingGrade = result.passingGrade;
        this.quizStatus = result.quizStatus;
        this.totalQuestions = result.totalQuestions;
        console.log(this.quizStatus);
        if (this.quizStatus === 'Passed') {
          this.displayQuiz = false;
          this.displayPass = true;
          this.displayFail = false;
          this.notFailedFinal = false;
        } else if (this.quizStatus === 'Failed') {
          this.displayQuiz = false;
          this.displayFail = true;
          this.notFailedFinal = true;
          this.displayPass = false;
        } else if (this.quizStatus === 'Failed Final') {
          this.displayQuiz = false;
          this.displayFail = true;
          this.notFailedFinal = false;
          this.displayPass = false;
        }
        this.handleRefreshClick();
      })
      .catch(error => {
        this.error = error;
        console.log(('test check error @@@@', this.error));
      })

  }

  reviewQuestionsFn() {
    if (!this.courseModulePartId) {
      console.error('courseModulePartId is null or undefined');
      return;
    }
    this.showReviewModal = true;
    this.getCourseQuizModulesAnswersData(this.courseModulePartId);
  }

  getCourseQuizModulesAnswersData(courseId) {
    getCourseQuizModulesAnswers({ courseId })
      .then((result) => {
        this.correctPartAnswers = result; // Contains correct answers
        this.mapParticipantAnswers(result); // Map participant's answers
      })
      .catch((error) => {
        console.error('Error fetching participant answers:', error);
      });
  }

  mapParticipantAnswers(participantData) {
    this.questions.forEach((question, index) => {
      const answerField = `Participant_s_Answer_of_Quiz_Question_${index + 1}__c`;
      const selectedAnswer = participantData[0]?.[answerField] || null;
      question.selectedAnswer = selectedAnswer;
      question.isCorrect = String(selectedAnswer) === String(question.correctAnswer);
      console.log('selectedAnswer:', selectedAnswer, 'correctAnswer:', question.correctAnswer);
      question.options.forEach(option => {
        const optionText = String(option.text);
        option.resultText = '';
        if (optionText === String(selectedAnswer) && optionText === String(question.correctAnswer)) {
          option.dynamicColor = 'background-color: rgb(194 251 224); color: black; padding: 10px; border-radius: 30px; margin: 5px;';
          option.isChecked = true;
          option.resultText = '✔ Your answer is correct';
        }
        else if (optionText === String(selectedAnswer) && optionText !== String(question.correctAnswer)) {
          option.dynamicColor = 'background-color: rgb(248 168 160); color: black; padding: 10px; border-radius: 30px; margin: 5px;';
          option.isChecked = true;
          option.resultText = '✖ Your answer is incorrect';
        }
        else if (optionText === String(question.correctAnswer)) {
          option.dynamicColor = 'background-color: rgb(194 251 224); color: black; padding: 10px; border-radius: 30px; margin: 5px;';
          option.resultText = '✔ Correct Answer';
        }
        else {
          option.dynamicColor = 'padding: 10px; border-radius: 30px; background-color: #f8f4f4; margin: 5px;';
        }
      });
    });

    console.log('this.questions!!!!!', JSON.stringify(this.questions));
  }

  handleRefreshClick() {
    const message = true;
    this.dispatchEvent(new CustomEvent('refreshnodule', { detail: message }));
  }

  // Open Review Modal
  reviewQuestionsFn() {
    this.showReviewModal = true;
    console.log('courseModulePartId@@@@', this.courseModulePartId)
    this.getCourseQuizModulesAnswersData(this.courseModulePartId);

  }
  closeReviewModal() {
    this.showReviewModal = false;
  }

  retakeQuiz() {
    this.displayFail = false;
    const event = new CustomEvent('retakequiz', {
      detail: {
        courseModulePartId: this.courseModulePartId,
        isRetakeFlag: true
      }
    });
    this.dispatchEvent(event);
  }

handleRowClick(event) {
    const optionId = event.currentTarget.dataset.id;
    const optionValue = event.currentTarget.dataset.value;
    console.log(optionValue);
    const radioInput = event.currentTarget.querySelector('input[type="radio"]');
    if (radioInput) {
        radioInput.checked = true;
        radioInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
}

}
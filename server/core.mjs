// 자동 생성 파일입니다. 직접 고치지 말고 worker/ · client/data.js · drizzle/ 를 고친 뒤 `npm run build` 를 실행하세요.
(function (root) {
  'use strict';

  // Authored contrasts for the current course. These are wrong meanings, never
  // alternate translations. Unknown material may return fewer than three safe
  // options; callers must use writing practice rather than inventing fillers.
  // Unregistered English is intentionally not inferred from another card's
  // correct answer: close wording cannot establish a genuinely wrong meaning.
  const bank = new Map();
  function english(value) {
    return String(value || '').normalize('NFKC').toLowerCase().replace(/[’‘]/g, "'")
      .replace(/\bi'm\b/g, 'i am').replace(/\bi'd\b/g, 'i would').replace(/\bi'll\b/g, 'i will')
      .replace(/\bwe're\b/g, 'we are').replace(/\blet's\b/g, 'let us').replace(/\bit's\b/g, 'it is')
      .replace(/\bdon't\b/g, 'do not').replace(/\bcan't\b/g, 'cannot')
      .replace(/[^\p{L}\p{N}]+/gu, ' ').trim().replace(/\s+/g, ' ');
  }
  function korean(value) {
    return String(value || '').normalize('NFKC').toLowerCase()
      .replace(/참석|참가/g, '참여').replace(/융통성|탄력성/g, '유연성')
      .replace(/이따금|간혹|때때로|때로/g, '가끔')
      .replace(/고급형|상위급|상급/g, '고급').replace(/국외/g, '해외')
      .replace(/주십시오|주세요|주시겠어요|주실래요/g, '요청')
      .replace(/합니다|해요|한다/g, '하다').replace(/입니다|이에요|예요/g, '')
      .replace(/[^\p{L}\p{N}]/gu, '');
  }
  function add(keys, kind, domain, pos, wrong) {
    const entry = Object.freeze({ kind, domain, pos, wrong: Object.freeze(wrong.slice()) });
    for (const key of Array.isArray(keys) ? keys : [keys]) bank.set(english(key), entry);
  }
  const W = (keys, domain, wrong, pos = 'noun') => add(keys, '단어', domain, pos, wrong);
  const S = (keys, domain, wrong, pos = 'sentence') => add(keys, '표현', domain, pos, wrong);

  // Course 1: motivation and goals.
  S('I signed up because I want to feel more confident speaking English.', 'learning', ['영어 이메일 작성 시간을 줄이고 싶어서 신청했어요.', '영어 듣기 평가의 점수를 확인하려고 신청했어요.', '영어 문법을 가르치는 자격을 얻으려고 신청했어요.']);
  S("I'd like to build my confidence in speaking with international clients.", 'communication', ['해외 고객과의 회의 시간을 줄이고 싶어요.', '해외 고객에게 보낼 문서를 번역하고 싶어요.', '해외 고객의 주문 내역을 확인하고 싶어요.']);
  S('My biggest challenge is finding time to practice.', 'learning', ['가장 큰 어려움은 연습할 장소를 찾는 거예요.', '가장 큰 어려움은 연습할 상대를 찾는 거예요.', '가장 큰 어려움은 연습할 교재를 고르는 거예요.']);
  S('What made you decide to join this class?', 'learning', ['어느 수업에 등록하셨나요?', '수업에 언제부터 참여하셨나요?', '수업을 누구와 함께 들으셨나요?'], 'question');
  S('What do you hope to get out of it?', 'learning', ['이 수업에 어떻게 신청하셨나요?', '이 수업을 얼마나 오래 들으셨나요?', '이 수업을 다른 사람에게 추천하셨나요?'], 'question');
  S('What has stopped you from studying English before?', 'learning', ['이전에 어떤 영어 교재를 사용하셨나요?', '이전에 영어를 어디에서 배우셨나요?', '이전에 영어 공부를 얼마나 오래 하셨나요?'], 'question');
  S('I signed up because…', 'learning', ['…하는 조건으로 등록할 수 있어요.', '…해서 등록을 취소했어요.', '…한 날짜에 수업이 시작돼요.']);
  S("I'd like to build my confidence in…", 'learning', ['…을 배우는 데 드는 비용을 줄이고 싶어요.', '…을 가르칠 자격을 취득하고 싶어요.', '…을 연습할 장소를 예약하고 싶어요.']);
  S('My biggest challenge is…', 'evaluation', ['가장 큰 장점은 …예요.', '가장 중요한 성과는 …예요.', '가장 큰 기회는 …예요.']);
  S('My long-term goal is to work with global teams.', 'goals', ['장기 목표는 글로벌 팀을 위한 교육 과정을 만드는 거예요.', '장기 목표는 해외 지사를 설립하는 거예요.', '장기 목표는 글로벌 팀의 업무를 평가하는 거예요.']);
  S('It would open up opportunities to work abroad.', 'goals', ['해외 근무에 필요한 비용을 줄여 줄 거예요.', '해외 근무에 필요한 자격을 보장해 줄 거예요.', '해외 근무 기간을 단축해 줄 거예요.']);
  S('I want to become more fluent in English.', 'learning', ['영어를 더 정확하게 번역하고 싶어요.', '영어 문법을 더 자세히 설명하고 싶어요.', '영어 시험 점수를 더 높이고 싶어요.']);
  S('My long-term goal is to…', 'goals', ['이번 주에 끝낼 업무는 …예요.', '제가 지금 담당하는 일은 …예요.', '제가 이미 달성한 성과는 …예요.']);
  S('It would open up opportunities to…', 'goals', ['그것은 …하는 비용을 줄여 줄 거예요.', '그것은 …하는 기간을 단축해 줄 거예요.', '그것은 …하는 자격을 보장해 줄 거예요.']);

  // Course 2: role, responsibilities and work evaluation.
  S('I work in marketing.', 'roles', ['저는 영업 분야에서 일해요.', '저는 회계 분야에서 일해요.', '저는 인사 분야에서 일해요.']);
  S("I'm responsible for planning campaigns.", 'marketing', ['저는 캠페인 예산 승인을 담당해요.', '저는 캠페인 결과 평가를 담당해요.', '저는 캠페인 자료 배포를 담당해요.']);
  S('My role involves analyzing customer data.', 'marketing', ['제 역할에는 고객 데이터 수집이 포함돼요.', '제 역할에는 고객 데이터 보관이 포함돼요.', '제 역할에는 고객 데이터 전달이 포함돼요.']);
  S(['What do you do for a living?', 'What do you do?'], 'roles', ['어느 회사에서 일하시나요?', '보통 몇 시에 일을 시작하시나요?', '현재 직장에서 얼마나 오래 일하셨나요?'], 'question');
  S('What does a typical workday look like?', 'roles', ['보통 근무일에 무엇을 입으시나요?', '근무하는 사무실은 어떻게 생겼나요?', '일주일에 며칠 근무하시나요?'], 'question');
  S('I work as a…', 'roles', ['저는 …을 담당자에게 요청해요.', '저는 …에게 업무를 배정해요.', '저는 …이라는 회사에 지원해요.']);
  S('I work in…', 'roles', ['저는 … 분야에 투자해요.', '저는 … 분야의 교육을 수강해요.', '저는 … 분야로 이직을 준비해요.']);
  S("I'm responsible for…", 'roles', ['저는 …을 다른 사람에게 맡겨요.', '저는 …에 대한 승인을 기다려요.', '저는 …을 외부에 요청해요.']);
  S('My role involves…', 'roles', ['제 업무에서 제외되는 일은 …예요.', '제가 지원하려는 직무는 …예요.', '제가 다른 부서에 요청한 일은 …예요.']);
  S('One major advantage is the flexibility.', 'evaluation', ['큰 장점 중 하나는 안정성이에요.', '큰 장점 중 하나는 높은 보수예요.', '큰 장점 중 하나는 명확한 승진 기준이에요.']);
  S('On the downside, deadlines can be stressful.', 'schedule', ['반면 아쉬운 점은 출퇴근 시간이 길 수 있다는 거예요.', '반면 아쉬운 점은 업무 지침이 불명확할 수 있다는 거예요.', '반면 아쉬운 점은 회의가 자주 변경될 수 있다는 거예요.']);
  S('The most rewarding part is helping people.', 'evaluation', ['가장 보람 있는 부분은 새로운 기술을 배우는 거예요.', '가장 보람 있는 부분은 어려운 목표를 달성하는 거예요.', '가장 보람 있는 부분은 성과를 인정받는 거예요.']);
  S('One major advantage is…', 'evaluation', ['큰 단점 중 하나는 …예요.', '주요 업무 중 하나는 …예요.', '지원 자격 중 하나는 …예요.']);
  S('On the downside,…', 'evaluation', ['가장 큰 장점은 …예요.', '예를 들어 …예요.', '결론적으로 …예요.']);
  S('The most rewarding part is…', 'evaluation', ['가장 어려운 부분은 …예요.', '가장 시간이 오래 걸리는 부분은 …예요.', '가장 먼저 처리해야 할 부분은 …예요.']);

  // Course 3: English at work and collaboration.
  S('English plays a key role in communicating with overseas partners.', 'communication', ['영어는 해외 파트너의 업무를 평가하는 데 핵심적인 역할을 해요.', '영어는 해외 파트너를 교육하는 데 핵심적인 역할을 해요.', '영어는 해외 파트너와 계약 조건을 작성하는 데 핵심적인 역할을 해요.']);
  S('I occasionally need to present ideas in English.', 'communication', ['가끔 영어로 회의 내용을 기록해야 해요.', '가끔 영어로 고객 질문에 답해야 해요.', '가끔 영어로 업무 자료를 검토해야 해요.']);
  S('It would help me communicate more effectively with clients.', 'communication', ['그것은 고객과 더 자주 만나는 데 도움이 될 거예요.', '그것은 고객 정보를 더 정확히 기록하는 데 도움이 될 거예요.', '그것은 고객 요청을 더 빠르게 처리하는 데 도움이 될 거예요.']);
  S('English plays a key role in…', 'communication', ['영어는 …에 거의 사용되지 않아요.', '영어는 …의 필수 지원 자격이에요.', '영어는 …의 유일한 평가 기준이에요.']);
  S('I occasionally need to…', 'schedule', ['저는 항상 …해야 해요.', '저는 당장 …해야 해요.', '저는 정기적으로 …해야 해요.']);
  S('It would help me communicate more effectively with…', 'communication', ['그것은 …와 더 자주 만나는 데 도움이 될 거예요.', '그것은 …에게 더 많은 업무를 맡기는 데 도움이 될 거예요.', '그것은 …의 업무 성과를 평가하는 데 도움이 될 거예요.']);
  S(['Please keep me in the loop.', 'Could you keep me in the loop?'], 'communication', ['최종 승인을 저에게 요청해 주세요.', '업무 역할을 저에게 배정해 주세요.', '회의 일정을 저와 확정해 주세요.'], 'request');
  S(["Let's make sure we're on the same page.", 'Let us make sure we are on the same page.'], 'collaboration', ['우리 모두 같은 문서를 받았는지 확인해 봅시다.', '우리 모두 같은 회의에 참석하는지 확인해 봅시다.', '우리 모두 같은 업무를 맡았는지 확인해 봅시다.']);
  S(["I'll follow up on the proposal tomorrow.", 'I will follow up on the proposal tomorrow.'], 'operations', ['내일 그 제안서를 새로 작성하겠습니다.', '내일 그 제안 건을 최종 승인하겠습니다.', '내일 그 제안서를 다른 부서에 배정하겠습니다.']);
  S(['keep someone in the loop', 'keep me in the loop', 'keep us in the loop', 'keep you in the loop'], 'communication', ['최종 승인을 요청하다', '업무 담당자를 배정하다', '회의 일정을 확정하다'], 'verb');
  S(['be on the same page', 'on the same page'], 'collaboration', ['서로 업무를 나누어 맡다', '서로 일정에 맞춰 회의를 잡다', '서로 문서를 교환하다'], 'verb');
  S('follow up on', 'operations', ['새 안건을 제안하다', '최종 결정을 승인하다', '담당 업무를 다른 부서로 넘기다'], 'verb');
  S('take into account', 'evaluation', ['최종 승인을 내리다', '책임을 다른 사람에게 넘기다', '세부 정보를 공개하다'], 'verb');
  S(['be tied up', 'I am tied up', "I'm tied up"], 'schedule', ['다른 일정을 취소하다', '업무를 다른 사람에게 맡기다', '맡은 일을 모두 마치다'], 'verb');
  S('get the ball rolling', 'operations', ['일을 마무리하다', '진행 상황을 점검하다', '결과를 최종 승인하다'], 'verb');
  S('find middle ground', 'collaboration', ['한쪽 의견을 전부 받아들이다', '최종 결정을 미루다', '상대방의 제안을 철회시키다'], 'verb');
  S('go the extra mile', 'evaluation', ['정해진 기준만 충족하다', '업무 범위를 줄이다', '진행 속도를 늦추다'], 'verb');
  S(["have a lot on one's plate", 'have a lot on my plate', 'have a lot on your plate', 'have a lot on their plate'], 'schedule', ['해야 할 일을 모두 마치다', '맡은 업무의 범위를 줄이다', '새 업무를 맡을 여유가 있다'], 'verb');
  S('ripple through', 'change', ['영향이 한곳에만 머무르다', '변화가 완전히 멈추다', '원인을 거슬러 추적하다'], 'verb');
  S('lash out', 'emotions', ['차분하게 이유를 설명하다', '상대방의 의견을 지지하다', '갈등을 피하려고 침묵하다'], 'verb');
  S('double down', 'operations', ['기존 계획을 철회하다', '투입하는 노력을 줄이다', '최종 결정을 보류하다'], 'verb');
  S('rubber-stamp parliament', 'politics', ['정부 정책을 독립적으로 심의하는 의회', '정부 예산을 자율적으로 삭감하는 의회', '정부 법안에 수정을 요구하는 의회']);
  S('funneling information', 'communication', ['정보 접근 권한을 차단하는 것', '정보의 사실 여부를 검증하는 것', '정보를 암호화하여 보관하는 것'], 'noun');

  // Follow-up questions and the final commitment.
  S('Could you tell us more about that?', 'communication', ['그 내용을 한 문장으로 요약해 주시겠어요?', '그 내용을 다른 언어로 번역해 주시겠어요?', '다음 주제로 넘어가 주시겠어요?'], 'request');
  S('Can you give us an example?', 'communication', ['예시의 수를 세어 주시겠어요?', '전체 내용을 요약해 주시겠어요?', '핵심 용어를 번역해 주시겠어요?'], 'request');
  S('How did you handle that situation?', 'operations', ['그 상황이 언제 발생했나요?', '그 상황에 누가 관련되어 있었나요?', '그 상황이 어디에서 발생했나요?'], 'question');
  S('What makes you say that?', 'communication', ['그 말씀을 누구에게 전하셨나요?', '그 말씀을 언제 하셨나요?', '그 말씀을 어떻게 전달하셨나요?'], 'question');
  S('Has your opinion changed over time?', 'evaluation', ['그 의견을 다른 사람과 공유하셨나요?', '그 의견을 언제 처음 말씀하셨나요?', '그 의견에 다른 사람이 동의했나요?'], 'question');
  S('In the next three months, I want to be able to…', 'goals', ['지난 3개월 동안 …할 수 있었어요.', '3개월마다 …해야 해요.', '앞으로 3개월 동안 …을 가르칠 예정이에요.']);

  // The 18 words in the current teacher course.
  W('confidence', 'motivation', ['자격', '경력', '평판']);
  W(['motivation', 'motive'], 'motivation', ['자격 요건', '근무 환경', '업무 성과']);
  W('opportunity', 'goals', ['위험', '자원', '의무']);
  W('priority', 'operations', ['업무량', '마감 기한', '담당자']);
  W('workload', 'operations', ['업무 우선순위', '담당 부서', '작업 절차']);
  W(['responsibility', 'responsibilities'], 'roles', ['권한', '권리', '재량']);
  W('campaign', 'marketing', ['정기 감사', '직원 채용', '재무 결산']);
  W(['analyze', 'analyse'], 'operations', ['수집하다', '배포하다', '보관하다'], 'verb');
  W('flexibility', 'evaluation', ['정확성', '일관성', '보안성']);
  W(['deadline', 'due date'], 'schedule', ['착수 시각', '작업 소요 기간', '회의 예정일']);
  W('rewarding', 'evaluation', ['반복적인', '부담이 큰', '예측 가능한'], 'adjective');
  W('occasionally', 'schedule', ['항상', '정기적으로', '즉시'], 'adverb');
  W(['overseas', 'abroad'], 'travel', ['국내의; 국내에', '사내의; 사내에서', '온라인의; 온라인으로'], 'adjective');
  W('commitment', 'goals', ['성과 평가', '잠정적인 관심', '사업 철수']);
  W('breakneck', 'change', ['매우 느린', '일정한 속도의', '단계적으로 진행되는'], 'adjective');
  W(['liabilities', 'liability'], 'finance', ['자산', '자본', '비용']);
  W('involution', 'competition', ['효율적인 내부 협력', '기술 혁신을 통한 생산성 향상', '경쟁 완화에 따른 업무 안정']);
  W(['higher-end', 'high-end', 'higher end'], 'marketing', ['보급형의', '중급형의', '도매용의'], 'adjective');
  W('unfolding', 'change', ['완료된', '보류된', '취소된'], 'adjective');

  // Common foundation vocabulary, kept separate from sentence questions.
  W(['profession', 'occupation'], 'roles', ['직위', '부서', '업종']);
  W('veterinarian', 'health', ['동물 진료 보조인력', '동물 훈련사', '동물 미용사']);
  W('veterinary clinic', 'health', ['동물 보호소', '동물 훈련소', '축산 농장']);
  W('veterinary technician', 'health', ['수의사', '동물 훈련사', '동물 미용사']);
  W('preparation', 'operations', ['실행', '검토', '마무리']);
  W('chop', 'food', ['얇게 저미다', '껍질을 벗기다', '반죽하다'], 'verb');
  W('slice', 'food', ['잘게 다지다', '껍질을 벗기다', '반죽하다'], 'verb');
  W('freight forwarder', 'trade', ['화물 운송 기사', '세관 공무원', '창고 관리인']);
  W('shipment', 'trade', ['통관 수수료', '운송 계약서', '하역 장비']);
  W(['cargo', 'freight'], 'trade', ['운송 차량', '하역 장비', '운송 계약서']);
  W('export', 'trade', ['수입; 수입하다', '보관; 보관하다', '통관; 통관하다']);
  W('import', 'trade', ['수출; 수출하다', '보관; 보관하다', '통관; 통관하다']);
  W('LCL', 'trade', ['컨테이너 한 대를 채우는 단독 화물', '냉장 컨테이너 전용 화물', '항공 운송 전용 화물']);
  W('public sector', 'roles', ['민간 부문', '민간 비영리 부문', '개인 자영업 부문']);
  W('department', 'roles', ['직급', '사업장', '업종']);
  W('establish', 'operations', ['인수하다', '이전하다', '폐쇄하다'], 'verb');
  W('employ', 'roles', ['해고하다', '교육하다', '평가하다'], 'verb');
  W('startup', 'roles', ['공기업', '대기업 집단', '해외 지사']);
  W('developer', 'technology', ['디자이너', '품질 검사원', '회계 담당자']);
  W('abbreviation', 'language', ['전문용어', '동의어', '문장부호']);
  W('replace', 'operations', ['수리하다', '보완하다', '추가하다'], 'verb');
  W('specific', 'evaluation', ['포괄적인', '일반적인', '모호한'], 'adjective');
  W('consistency', 'evaluation', ['정확성', '신속성', '유연성']);
  W('persistence', 'motivation', ['일시적 관심', '순간적인 열의', '계획 변경']);
  W('strengthen', 'change', ['유지하다', '약화하다', '교체하다'], 'verb');
  W('expand', 'change', ['축소하다', '유지하다', '분할하다'], 'verb');
  W('range', 'evaluation', ['비율', '수량', '빈도']);
  W('fluent', 'language', ['정확한', '간결한', '설득력 있는'], 'adjective');
  W('potential', 'goals', ['현재 실적', '누적 경력', '확정 목표']);
  W('retirement', 'roles', ['승진', '전근', '휴직']);
  W('missionary', 'faith', ['교회 행정 담당자', '예배 반주자', '교회 건축가']);
  W('evangelist', 'faith', ['교회 행정 담당자', '성경 번역가', '예배 반주자']);
  W('proclaim', 'communication', ['철회하다', '검토하다', '숨기다'], 'verb');
  W('gospel', 'faith', ['율법', '예배 의식', '교회 재정']);
  W('encourage', 'communication', ['경고하다', '비판하다', '명령하다'], 'verb');
  W('terminology', 'language', ['일상용어', '문장부호', '철자 규칙']);
  W('paperwork', 'operations', ['현장 작업', '대면 고객 상담', '제품 운송']);
  W('administrative work', 'operations', ['제품 개발', '현장 설치', '대면 판매']);
  W('strength', 'evaluation', ['약점', '기회', '위협']);
  W('weakness', 'evaluation', ['강점', '기회', '위협']);
  W('certificate', 'education', ['신청서', '설문지', '업무 계획서']);
  W('bullying', 'emotions', ['협력', '격려', '중재']);
  W('heartbreaking', 'emotions', ['안도감을 주는', '기대를 높이는', '자신감을 주는'], 'adjective');
  W('consult', 'communication', ['통보하다', '지시하다', '평가하다'], 'verb');
  W('recover', 'health', ['악화되다', '예방하다', '진단하다'], 'verb');
  W('encounter', 'operations', ['피하다', '예측하다', '해결하다'], 'verb');
  W('generation gap', 'collaboration', ['임금 격차', '직급 차이', '근무 시간 차이']);
  W('senior executive', 'roles', ['중간 관리자', '신입 직원', '외부 자문위원']);
  W(['gather', 'collect'], 'operations', ['분배하다', '폐기하다', '분석하다'], 'verb');
  W('congregation', 'faith', ['교단의 교리', '예배 순서', '교회 건물']);
  W('confess', 'communication', ['부인하다', '추측하다', '질문하다'], 'verb');
  W('colleague', 'roles', ['상사', '고객', '거래처 담당자']);
  W(['enthusiastic', 'passionate'], 'motivation', ['무관심한', '망설이는', '냉정한'], 'adjective');
  W('daily life', 'schedule', ['장기 계획', '일회성 행사', '특별 출장']);
  W('conglomerate', 'roles', ['단일 사업 개인기업', '민간 비영리 단체', '정부 행정 기관']);
  W('retreat', 'education', ['정기 업무 회의', '채용 설명회', '성과 평가 면담']);

  // Frequent future business words and shared synonym families.
  W(['receivables', 'accounts receivable'], 'finance', ['미지급금', '재고 자산', '납입 자본']);
  W(['payables', 'accounts payable'], 'finance', ['매출채권', '재고 자산', '이익잉여금']);
  W(['funding', 'financing'], 'finance', ['자금 상환', '매출 집계', '비용 정산']);
  W('efficiency', 'evaluation', ['정확성', '보안성', '유연성']);

  // Common foundation sentences.
  S('Please call me JJ.', 'communication', ['JJ에게 연락해 주세요.', 'JJ를 소개해 주세요.', 'JJ의 이름을 적어 주세요.'], 'request');
  S('Let me introduce myself.', 'communication', ['다른 사람을 소개하겠습니다.', '제 의견을 설명하겠습니다.', '제 질문에 답해 주시겠어요?']);
  S('I work in the public sector.', 'roles', ['저는 민간 부문에서 일합니다.', '저는 공공부문에 지원하고 있습니다.', '저는 공공기관과 거래합니다.']);
  S('I work in the Performance Management Department.', 'roles', ['저는 인사관리 부서에서 일합니다.', '저는 재무관리 부서에서 일합니다.', '저는 교육지원 부서에서 일합니다.']);
  S('My company was established in 2004.', 'roles', ['우리 회사는 2004년에 이전했습니다.', '저는 2004년에 이 회사에 입사했습니다.', '우리 회사는 2004년에 합병되었습니다.']);
  S('How long have you worked for your company?', 'roles', ['회사에서 하루에 몇 시간 일하시나요?', '회사에서 어떤 업무를 담당하시나요?', '현재 회사에 왜 입사하셨나요?'], 'question');
  S('I have worked here for 26 years.', 'roles', ['저는 26년 전에 이곳을 떠났습니다.', '저는 26살 때 이곳에서 일했습니다.', '저는 26년 동안 이곳에서 공부했습니다.']);
  S('I work as a veterinary technician.', 'roles', ['저는 수의사로 일합니다.', '저는 동물 훈련사로 일합니다.', '저는 동물 미용사로 일합니다.']);
  S('I work as a cook.', 'roles', ['저는 식당 관리자로 일합니다.', '저는 식재료 납품업자로 일합니다.', '저는 식품 검사원으로 일합니다.']);
  S('My responsibilities include preparing meals and washing dishes.', 'operations', ['제 담당업무에는 식재료 주문과 재고 관리가 포함됩니다.', '제 담당업무에는 메뉴 기획과 직원 교육이 포함됩니다.', '제 담당업무에는 고객 응대와 주문 접수가 포함됩니다.']);
  S('I am in charge of the education department.', 'roles', ['저는 교육부서에서 연수를 받고 있습니다.', '저는 교육부서에 자료를 요청합니다.', '저는 교육부서의 업무를 지원합니다.']);
  S('I teach the Bible to children.', 'education', ['저는 아이들과 성경을 함께 배웁니다.', '저는 어른들에게 성경을 가르칩니다.', '저는 아이들에게 영어를 가르칩니다.']);
  S('I work as a freight forwarder.', 'roles', ['저는 화물 운송 기사로 일합니다.', '저는 창고 관리인으로 일합니다.', '저는 세관 공무원으로 일합니다.']);
  S('We consolidate small shipments into one container.', 'trade', ['우리는 큰 화물을 여러 컨테이너로 나눠 싣습니다.', '우리는 소량 화물을 항공편으로 보냅니다.', '우리는 한 컨테이너의 화물을 여러 창고로 분산합니다.']);
  S('I am responsible for gathering performance data from each department.', 'operations', ['저는 각 부서의 실적 자료를 평가하는 일을 담당합니다.', '저는 각 부서에 실적 목표를 배정하는 일을 담당합니다.', '저는 각 부서의 실적 자료를 외부에 공개하는 일을 담당합니다.']);
  S('Please send me your annual performance data.', 'operations', ['연간 실적 목표를 정해 주세요.', '연간 실적 자료를 보관해 주세요.', '연간 실적 자료를 검토해 주세요.'], 'request');
  S('I used to work for a startup.', 'roles', ['저는 앞으로 스타트업에서 일할 예정입니다.', '저는 스타트업에 취업하고 싶습니다.', '저는 스타트업을 설립한 적이 있습니다.']);
  S('Why do you want to study English?', 'learning', ['어떻게 영어를 공부하고 싶으세요?', '언제 영어 공부를 시작하고 싶으세요?', '누구와 영어를 공부하고 싶으세요?'], 'question');
  S('I want to communicate with people from other countries.', 'communication', ['저는 다른 나라 사람들에게 영어를 가르치고 싶습니다.', '저는 다른 나라 사람들의 문서를 번역하고 싶습니다.', '저는 다른 나라 사람들의 업무를 평가하고 싶습니다.']);
  S('I am interested in other cultures.', 'learning', ['저는 다른 문화에 익숙합니다.', '저는 다른 문화를 연구한 경험이 있습니다.', '저는 다른 문화의 언어를 가르칩니다.']);
  S('I want to strengthen my professional skills.', 'goals', ['저는 전문 자격을 평가하고 싶습니다.', '저는 다른 사람에게 전문 기술을 가르치고 싶습니다.', '저는 전문 분야를 바꾸고 싶습니다.']);
  S('I want to share the gospel with more people.', 'faith', ['저는 더 많은 사람에게 예배 일정을 알리고 싶습니다.', '저는 더 많은 사람과 성경 번역을 검토하고 싶습니다.', '저는 더 많은 사람에게 교회 재정을 설명하고 싶습니다.']);
  S('After I retire, I want to travel abroad with my wife.', 'travel', ['은퇴 전에 아내와 해외여행을 하고 싶습니다.', '은퇴 후 아내와 국내여행을 하고 싶습니다.', '은퇴 후 아내와 해외에서 일하고 싶습니다.']);
  S('I want to communicate with missionaries.', 'faith', ['저는 선교사들의 업무를 평가하고 싶습니다.', '저는 선교사들을 위한 교재를 만들고 싶습니다.', '저는 선교사들의 여행을 준비하고 싶습니다.']);
  S('Having a specific goal is important.', 'goals', ['목표를 자주 바꾸는 것이 중요합니다.', '여러 목표를 동시에 추구하는 것이 중요합니다.', '목표보다 결과를 먼저 평가하는 것이 중요합니다.']);
  S('Consistency is important when learning English.', 'learning', ['영어를 배울 때 정확성이 중요합니다.', '영어를 배울 때 속도가 중요합니다.', '영어를 배울 때 경쟁이 중요합니다.']);
  S('What is the most difficult part of your job?', 'evaluation', ['일하면서 가장 보람 있는 점은 무엇인가요?', '일하면서 가장 자주 하는 일은 무엇인가요?', '일하면서 가장 시간이 오래 걸리는 일은 무엇인가요?'], 'question');
  S('I find it difficult to collect data from other departments.', 'operations', ['다른 부서에 자료를 배포하는 것이 어렵습니다.', '다른 부서의 자료를 분석하는 것이 어렵습니다.', '다른 부서의 자료를 보관하는 것이 어렵습니다.']);
  S('There is a generation gap.', 'collaboration', ['직급 차이가 있습니다.', '임금 격차가 있습니다.', '근무 시간 차이가 있습니다.']);
  S('I need to consult with their parents.', 'education', ['저는 그들의 부모님께 결과를 통보해야 합니다.', '저는 그들의 부모님을 평가해야 합니다.', '저는 그들의 부모님께 지시해야 합니다.']);
  S('We need to help students improve their grades.', 'education', ['우리는 학생들의 성적을 평가해야 합니다.', '우리는 학생들의 성적을 기록해야 합니다.', '우리는 학생들의 성적을 공개해야 합니다.']);
  S('My colleague dumped his responsibilities on me.', 'roles', ['동료가 제 업무를 대신 맡았습니다.', '동료가 제 업무를 평가했습니다.', '동료가 자신의 업무를 저와 나눴습니다.']);
  S('I am the youngest member of the team.', 'roles', ['저는 팀에서 경력이 가장 짧습니다.', '저는 팀에 가장 늦게 합류했습니다.', '저는 팀에서 직급이 가장 낮습니다.']);
  S('I cannot stand it.', 'emotions', ['저는 그것을 이해할 수 없습니다.', '저는 그것을 결정할 수 없습니다.', '저는 그것을 기억할 수 없습니다.']);
  S('Feel free to ask any questions.', 'communication', ['질문에 빠짐없이 답해 주세요.', '질문은 나중에 해 주세요.', '질문을 다른 사람에게 전달해 주세요.'], 'request');
  S('Take your time.', 'schedule', ['제시간에 도착하세요.', '시간을 정해 주세요.', '시간을 줄여 주세요.'], 'request');
  S('Could you say that again?', 'communication', ['다른 예를 말씀해 주시겠어요?', '그 내용을 요약해 주시겠어요?', '그 내용을 적어 주시겠어요?'], 'request');
  S("Let's move on to the next topic.", 'communication', ['다음 주제를 미룹시다.', '이전 주제로 돌아갑시다.', '현재 주제를 요약합시다.']);
  S('Keep it up!', 'motivation', ['다시 시작하세요.', '속도를 줄이세요.', '계획을 바꾸세요.'], 'request');
  S("Don't give up.", 'motivation', ['다시 처음부터 시작하세요.', '목표를 낮추세요.', '다른 방법을 선택하세요.'], 'request');
  S('Cheer up!', 'emotions', ['서둘러 주세요.', '집중해 주세요.', '잠시 쉬세요.'], 'request');
  S('Congratulations on your certificate!', 'education', ['자격증 취득을 응원합니다.', '자격증 신청을 권합니다.', '자격증 갱신을 안내합니다.']);
  S('I appreciate this English class.', 'learning', ['저는 이 영어 수업을 추천합니다.', '저는 이 영어 수업을 신청했습니다.', '저는 이 영어 수업을 준비합니다.']);
  S('I will pray for you.', 'faith', ['당신을 위해 봉사하겠습니다.', '당신을 위해 모금하겠습니다.', '당신과 함께 예배하겠습니다.']);

  // Conservative equivalence groups: alternative correct definitions are never
  // offered as distractors. Whole-sentence overlap alone is not semantic proof.
  const equivalents = [
    ['자신감','확신','신뢰','자기에 대한 믿음'], ['동기','의욕','동기부여','학습 의욕'],
    ['기회','호기'], ['우선순위','우선하는 일','우선권','중요도'],
    ['책임','담당업무','책무','의무'], ['캠페인','홍보 활동','홍보 운동'],
    ['분석하다','분석','상세 검토','자세히 검토'], ['유연성','융통성','탄력성','적응성','적응력'],
    ['마감 기한','마감일','기한','제출 기한','완료 기한'],
    ['보람 있는','만족감을 주는','만족스러운','가치 있는','성취감을 주는'],
    ['가끔','때때로','이따금','간혹','드물게','때로'],
    ['해외의','해외에','해외','국외의','국외에','외국의','외국에'],
    ['다짐','약속','헌신','의무','약정','전념'],
    ['매우 빠른','아찔할 만큼 빠른','엄청나게 빠른','맹렬한 속도의'],
    ['부채','채무','빚','법적 책임','갚아야 할 돈'],
    ['소모적인 내부 경쟁','경쟁의 과열','소모적 경쟁','내부 경쟁 과열'],
    ['더 고급인','고급형의','고가의','상급의','상위급의','최고급의'],
    ['전개되는','펼쳐지는','진행되는','드러나는','전개 중인','진행 중인'],
    ['화물','운송 화물','선적 화물'], ['격려하다','북돋다','용기를 주다'],
    ['꾸준함','일관성','꾸준한 실천'], ['끈기','인내','끈질김'],
    ['회복하다','회복되다','되찾다'], ['모으다','모을','수집하다','수집','취합하다','취합'],
    ['자금 조달','자금 마련','재원 조달'], ['매출채권','외상매출금','받을 돈'],
    ['미지급금','매입채무','지급할 돈'], ['효율성','효율'],
    ['비용','경비','지출','운영비','운영 비용'], ['자산','재산','보유 재산'],
    ['소요 시간','작업 소요 기간','처리 시간','처리 기간','업무 처리 소요시간'],
    ['범위','영역','적용 범위','업무 범위'], ['기획','계획','준비'],
    ['회의에 참여하다','회의에 참석하다','회의에 참가하다'],
    ['진행 상황을 공유하다','진행 상황을 알려주다','관련 소식을 계속 알리다'],
    ['타협점을 찾다','절충점을 찾다'], ['고려하다','감안하다'],
    ['후속 조치를 하다','진행 상황을 확인하다']
  ].map(group => group.map(korean));

  function forms(value) { return String(value || '').split(/[;,；，|]/u).map(korean).filter(Boolean); }
  function conceptSet(values) {
    const result = new Set();
    for (const value of values) for (let index = 0; index < equivalents.length; index++) {
      if (equivalents[index].some(alias => alias === value || (alias.length >= 4 && value.includes(alias)))) result.add(index);
    }
    return result;
  }
  function kindOf(card) { return card?.kind === '단어' ? '단어' : '표현'; }
  function distractors(card, pool = [], count = 3) {
    const limit = Number.isFinite(Number(count)) ? Math.max(0, Math.min(3, Math.floor(Number(count)))) : 3;
    if (!limit || !card || !String(card.ko || '').trim()) return [];
    const kind = kindOf(card), entry = bank.get(english(card.en));
    // Unknown words and sentences use English writing, never generated guesses.
    // The pool parameter is retained for the shared caller contract.
    if (!entry || entry.kind !== kind) return [];
    const accepted = [card.ko, card.meaning, card.translation, ...(Array.isArray(card.acceptedMeanings) ? card.acceptedMeanings : []), ...(Array.isArray(card.synonyms) ? card.synonyms : [])]
      .filter(value => typeof value === 'string').flatMap(forms);
    const concepts = conceptSet(accepted), used = new Set(), usedForms = new Set(), usedConcepts = new Set(), result = [];
    for (const value of entry.wrong) {
      if (result.length >= limit) break;
      if (typeof value !== 'string' || !value.trim() || /해당\s*뜻\s*없음|위의\s*(?:모두|없음)|정답\s*없음|다른\s*뜻|해당\s*없음|none of|all of the/iu.test(value)) continue;
      const options = forms(value), joined = korean(value);
      if (!options.length || !joined || used.has(joined) || options.some(option => accepted.includes(option) || usedForms.has(option))) continue;
      const optionConcepts = kind === '단어' ? conceptSet(options) : new Set();
      if ([...optionConcepts].some(id => concepts.has(id) || usedConcepts.has(id))) continue;
      result.push(value.trim()); used.add(joined);
      for (const form of options) usedForms.add(form);
      for (const id of optionConcepts) usedConcepts.add(id);
    }
    return result;
  }
  root.AJQuizOptions = Object.freeze({ distractors });
})(typeof window === 'object' ? window : globalThis);

const AVATAR_LIMITS = { species: 12, skin: 5, hair: 5, eyes: 3, outfit: 5, accessory: 5, color: 7 };
const DEFAULT_AVATAR = { species: 0, skin: 1, hair: 0, eyes: 0, outfit: 0, accessory: 0, color: 0 };
const PRICES = { 3: 150, 4: 250, 5: 400 };
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const SHOWCASE_TAGS = ['자기소개', '회의·협업', '업무·목표'];
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' } });
class ApiError extends Error { constructor(status, code, message) { super(message); this.status = status; this.code = code; } }
function fail(status, code, message) { throw new ApiError(status, code, message); }
function localDate(ms) { return new Date(ms + 9 * 3600000).toISOString().slice(0, 10); }
function decodeAvatar(value) { try { return JSON.parse(value); } catch { return DEFAULT_AVATAR; } }
function cleanText(value, max, label) { if (typeof value !== 'string' || !value.trim() || value.trim().length > max) fail(400, 'invalid_input', `${label}을(를) 1~${max}자로 입력해 주세요.`); return value.trim(); }
async function first(db, sql, ...args) { return db.prepare(sql).bind(...args).first(); }
async function all(db, sql, ...args) { const result = await db.prepare(sql).bind(...args).all(); return result.results || []; }
async function owned(db, userId) { const rows = await all(db, 'SELECT item_id FROM owned_items WHERE user_id = ? AND charged = 1', userId); return [0, 1, 2, ...rows.map(r => Number(r.item_id))]; }
async function likesRemaining(db, userId, day) { if (!userId) return 5; const row = await first(db, 'SELECT COUNT(*) AS n FROM showcase_likes WHERE user_id = ? AND local_date = ?', userId, day); return Math.max(0, 5 - row.n); }
async function showcasePost(db, id, roomId, userId) { const row = await first(db, 'SELECT s.id, s.user_id, s.sentence, s.meaning, s.tag, s.created_at AS createdAt, p.nickname, p.avatar, (SELECT COUNT(*) FROM showcase_likes l WHERE l.post_id = s.id) AS likes, EXISTS (SELECT 1 FROM showcase_likes l WHERE l.post_id = s.id AND l.user_id = ?) AS liked FROM showcase_posts s JOIN profiles p ON p.user_id = s.user_id WHERE s.id = ? AND s.room_id = ? AND s.deleted_at IS NULL', userId, id, roomId); if (!row) return null; const { user_id, ...post } = row; return { ...post, avatar: decodeAvatar(row.avatar), liked: !!post.liked, isMine: user_id === userId }; }
function userView(profile) { return { id: profile.public_id, nickname: profile.nickname, avatar: decodeAvatar(profile.avatar), totalPoints: profile.total_points, coins: profile.coins, level: 1 + Math.floor(profile.total_points / 250) }; }
function getLesson(courses, course, day) { const days = courses[course]; if (!Array.isArray(days) || !Number.isInteger(day) || day < 1 || day > 7) fail(400, 'invalid_lesson', '올바른 학습 미션을 선택해 주세요.'); const lesson = days.find(d => d.id === day) || days[day - 1]; if (!lesson || !Array.isArray(lesson.quiz) || !lesson.quiz.length) fail(400, 'invalid_lesson', '아직 준비되지 않은 미션입니다.'); return lesson; }
async function activeRoom(db, userId, profile) { if (!profile?.current_room_id) return null; return first(db, 'SELECT r.id, r.name, r.code, (SELECT COUNT(*) FROM room_members m WHERE m.room_id = r.id) AS memberCount FROM rooms r JOIN room_members m ON m.room_id = r.id AND m.user_id = ? WHERE r.id = ?', userId, profile.current_room_id); }
async function readSession(db, userId, id) { if (typeof id !== 'string' || id.length > 100) fail(400, 'invalid_session', '학습 세션을 확인해 주세요.'); const session = await first(db, 'SELECT * FROM learning_sessions WHERE id = ? AND user_id = ?', id, userId); if (!session) fail(404, 'session_not_found', '이 계정의 학습 세션을 찾을 수 없습니다.'); return session; }
function speechPasses(value) { try { const passed = JSON.parse(value || '[]'); return Array.isArray(passed) ? passed.filter(Number.isInteger).sort((a,b) => a-b) : []; } catch { return []; } }
const CONTRACTIONS = { "i'm":'i am', "you're":'you are', "we're":'we are', "they're":'they are', "he's":'he is', "she's":'she is', "it's":'it is', "that's":'that is', "what's":'what is', "there's":'there is', "don't":'do not', "doesn't":'does not', "didn't":'did not', "can't":'cannot', "couldn't":'could not', "won't":'will not', "wouldn't":'would not', "shouldn't":'should not', "isn't":'is not', "aren't":'are not', "wasn't":'was not', "weren't":'were not', "i've":'i have', "you've":'you have', "we've":'we have', "they've":'they have', "i'll":'i will', "you'll":'you will', "we'll":'we will', "they'll":'they will', "i'd":'i would', "you'd":'you would', "we'd":'we would', "they'd":'they would', "let's":'let us' };
function normalizeSpeech(value) { return value.normalize('NFKC').toLowerCase().replace(/[’‘]/g, "'").replace(/\b[a-z]+'[a-z]+\b/g, word => CONTRACTIONS[word] || word).replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim(); }
function compareSpeech(expected, actual) { const a = normalizeSpeech(expected).split(' ').filter(Boolean), b = normalizeSpeech(actual).split(' ').filter(Boolean); const passed = a.length > 0 && a.length === b.length && a.every((word,i) => word === b[i]); const dp = Array(b.length + 1).fill(0); for (const word of a) { let previous = 0; for (let j = 1; j <= b.length; j++) { const old = dp[j]; dp[j] = word === b[j-1] ? previous + 1 : Math.max(dp[j], dp[j-1]); previous = old; } } return { passed, match: passed ? 100 : Math.min(99, Math.round(100 * dp[b.length] / Math.max(a.length, b.length, 1))) }; }
function lessonForSession(session,courses){try{const stored=JSON.parse(session.lesson_json||'{}');if(Array.isArray(stored.phrases)&&Array.isArray(stored.quiz)&&stored.phrases.length&&stored.quiz.length)return stored;}catch{}return getLesson(courses,session.course,session.day);}
async function sessionView(db, session, courses, now) { if (!session) return null; const lesson = lessonForSession(session,courses); const answers = await all(db, 'SELECT question_index AS questionIndex, answer_index AS answerIndex, correct FROM quiz_answers WHERE session_id = ? ORDER BY question_index', session.id); return { id: session.id, day: session.day, course: session.course, startedAt: session.started_at, finishedAt: session.finished_at, elapsedSeconds: session.finished_at ? session.elapsed_seconds : Math.min(1800, Math.max(0, Math.floor((now - session.started_at) / 1000))), questions: lesson.quiz.map(q => ({ q: q.q, options: q.options })), answers, speechPassed: speechPasses(session.speech_json),lesson,chapterId:session.chapter_id||null }; }

/** x-aj-user-id 헤더는 server/adapter.mjs가 로그인 쿠키를 확인한 뒤에만 넣는다. 브라우저가 보낸 값은 어댑터에서 지운다. */
async function handleApi(request, env, courses, now = Date.now()) {
  try {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) return null;
    const userId = request.headers.get('x-aj-user-id');
    if (!env.DB) return json({ error: 'database_unavailable', message: '학습 저장소를 준비하고 있습니다. 잠시 후 다시 시도해 주세요.' }, 503);
    if (!['GET', 'POST'].includes(request.method)) fail(405, 'method_not_allowed', '지원하지 않는 요청입니다.');
    let body = {};
    if (request.method === 'POST') {
      if (!userId) fail(401, 'sign_in_required', '캐릭터와 학습 기록을 저장하려면 로그인해 주세요.');
      const origin = request.headers.get('origin');
      if (origin && origin !== url.origin) fail(403, 'invalid_origin', '사이트 안에서 다시 시도해 주세요.');
      if (!request.headers.get('content-type')?.includes('application/json')) fail(415, 'json_required', 'JSON 요청이 필요합니다.');
      const raw = await request.text();
      if (raw.length > 12000) fail(413, 'body_too_large', '입력 내용이 너무 깁니다.');
      try { body = JSON.parse(raw); } catch { fail(400, 'invalid_json', '입력 형식을 확인해 주세요.'); }
      if (!body || Array.isArray(body) || typeof body !== 'object') fail(400, 'invalid_json', '입력 형식을 확인해 주세요.');
    }
    const db = env.DB;
    const today = localDate(now), month = today.slice(0, 7);
    let profile = userId ? await first(db, 'SELECT * FROM profiles WHERE user_id = ?', userId) : null;

    if (request.method === 'GET' && url.pathname === '/api/state') {
      if (!userId || !profile) return json({ authenticated: !!userId, user: null, room: null, progress: { month, points: 0, activeDays: 0, totalSeconds: 0, questSeconds: 0, gameSeconds: 0, completedDays: [], todayCompleted: false, streak: 0, activity: [] }, sessions: [], activeSession: null, shop: { owned: [0, 1, 2], prices: PRICES } });
      const room = await activeRoom(db, userId, profile);
      const stats = await first(db, 'SELECT COALESCE(SUM(points),0) AS points, COUNT(CASE WHEN points > 0 THEN 1 END) AS activeDays, COALESCE(SUM(seconds),0) AS totalSeconds FROM learning_rewards WHERE user_id = ? AND month = ?', userId, month);
      const completed = await all(db, 'SELECT DISTINCT course, day, chapter_id FROM learning_sessions WHERE user_id = ? AND finished_at IS NOT NULL', userId);
      const activities = await all(db, "SELECT local_date AS date,SUM(points) AS points,SUM(seconds) AS seconds,SUM(questSeconds) AS questSeconds,SUM(gameSeconds) AS gameSeconds FROM (SELECT local_date,points,seconds,seconds AS questSeconds,0 AS gameSeconds FROM learning_rewards WHERE user_id=? UNION ALL SELECT local_date,points,seconds,0 AS questSeconds,CASE WHEN category='game' THEN seconds ELSE 0 END AS gameSeconds FROM activity_awards WHERE user_id=? AND applied=1) GROUP BY local_date ORDER BY local_date DESC LIMIT 120", userId,userId);
      const todayReward = activities.find(a => a.date === today);
      const todayQuest=await first(db,'SELECT id FROM learning_rewards WHERE user_id=? AND local_date=?',userId,today);
      const extra=await first(db,"SELECT COALESCE(SUM(CASE WHEN category='study' THEN points ELSE 0 END),0) AS studyPoints,COALESCE(SUM(CASE WHEN category='game' THEN points ELSE 0 END),0) AS gamePoints,COALESCE(SUM(seconds),0) AS seconds,COALESCE(SUM(CASE WHEN category='game' THEN seconds ELSE 0 END),0) AS gameSeconds FROM activity_awards WHERE user_id=? AND month=? AND applied=1",userId,month);
      const originalPoints=stats.points;stats.questSeconds=stats.totalSeconds;stats.gameSeconds=extra.gameSeconds;stats.points+=extra.studyPoints+extra.gamePoints;stats.totalSeconds+=extra.seconds;stats.activeDays=activities.filter(a=>a.date.startsWith(month)&&a.points>0).length;stats.studyPoints=originalPoints+extra.studyPoints;stats.gamePoints=extra.gamePoints;
      let streak = 0, cursor = todayReward?.points > 0 ? today : localDate(now - 86400000);
      for (const row of activities.filter(a => a.points > 0)) { if (row.date !== cursor) break; streak++; cursor = localDate(Date.parse(`${cursor}T00:00:00Z`) - 86400000 - 9 * 3600000); }
      const sessions = await all(db, 'SELECT s.id, s.course, s.day, s.local_date AS date, s.elapsed_seconds AS seconds, s.finished_at AS finishedAt, COALESCE(r.points,0) AS points FROM learning_sessions s LEFT JOIN learning_rewards r ON r.id = s.id WHERE s.user_id = ? AND s.finished_at IS NOT NULL ORDER BY s.finished_at DESC LIMIT 20', userId);
      const open = await first(db, 'SELECT * FROM learning_sessions WHERE user_id = ? AND local_date = ? AND finished_at IS NULL ORDER BY started_at DESC LIMIT 1', userId, today);
      return json({ authenticated: true, user: userView(profile), room, progress: { month, ...stats, completedDays: completed.map(d => d.chapter_id?`${d.course}:${d.chapter_id}:${d.day}`:`${d.course}:${d.day}`), todayCompleted: !!todayQuest, streak, activity: activities }, sessions, activeSession: await sessionView(db, open, courses, now), shop: { owned: await owned(db, userId), prices: PRICES } });
    }

    if (request.method === 'GET' && url.pathname === '/api/showcase') {
      const room = userId && profile ? await activeRoom(db, userId, profile) : null;
      const remaining = await likesRemaining(db, userId, today);
      if (!room) return json({ authenticated: !!userId, room: null, posts: [], likesRemaining: remaining, day: today });
      const rows = await all(db, 'SELECT s.id, s.sentence, s.meaning, s.tag, p.nickname, p.avatar, s.created_at AS createdAt, (SELECT COUNT(*) FROM showcase_likes l WHERE l.post_id = s.id) AS likes, EXISTS (SELECT 1 FROM showcase_likes l WHERE l.post_id = s.id AND l.user_id = ?) AS liked, CASE WHEN s.user_id = ? THEN 1 ELSE 0 END AS isMine FROM showcase_posts s JOIN profiles p ON p.user_id = s.user_id WHERE s.room_id = ? AND s.deleted_at IS NULL ORDER BY s.created_at DESC, s.id DESC LIMIT 100', userId, userId, room.id);
      return json({ authenticated: true, room, posts: rows.map(post => ({ ...post, avatar: decodeAvatar(post.avatar), liked: !!post.liked, isMine: !!post.isMine })), likesRemaining: remaining, day: today });
    }

    if (request.method === 'POST' && url.pathname === '/api/profile') {
      const nickname = cleanText(body.nickname, 16, '별명');
      const avatar = body.avatar && {species:0,...body.avatar};
      if (!avatar || Object.keys(AVATAR_LIMITS).some(key => !Number.isInteger(avatar[key]) || avatar[key] < 0 || avatar[key] > AVATAR_LIMITS[key])) fail(400, 'invalid_avatar', '캐릭터 항목을 다시 선택해 주세요.');
      if (!(await owned(db, userId)).includes(avatar.accessory)) fail(403, 'item_not_owned', '이 소품은 포인트 상점에서 먼저 구입해 주세요.');
      const normalized = Object.fromEntries(Object.keys(AVATAR_LIMITS).map(key => [key, avatar[key]]));
      await db.prepare('INSERT INTO profiles (user_id, public_id, nickname, avatar, created_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET nickname = excluded.nickname, avatar = excluded.avatar').bind(userId, crypto.randomUUID(), nickname, JSON.stringify(normalized), now).run();
      profile = await first(db, 'SELECT * FROM profiles WHERE user_id = ?', userId);
      return json({ user: userView(profile) });
    }

    if (request.method === 'GET' && url.pathname === '/api/leaderboard') {
      if (!userId) fail(401, 'sign_in_required', '우리 반 순위를 보려면 로그인해 주세요.');
      const room = await activeRoom(db, userId, profile);
      if (!room) return json({ month, room: null, rows: [], myRank: null });
      const requestedMonth = url.searchParams.get('month') || month;
      if (!/^20\d{2}-(0[1-9]|1[0-2])$/.test(requestedMonth)) fail(400, 'invalid_month', '월을 다시 선택해 주세요.');
      const rows = await all(db, 'SELECT p.public_id AS id, p.nickname, p.avatar, COALESCE(SUM(r.points),0) AS points, COUNT(CASE WHEN r.points > 0 THEN 1 END) AS activeDays, COALESCE(SUM(r.seconds),0) AS seconds FROM room_members m JOIN profiles p ON p.user_id = m.user_id LEFT JOIN learning_rewards r ON r.user_id = m.user_id AND r.room_id = m.room_id AND r.month = ? WHERE m.room_id = ? GROUP BY p.user_id ORDER BY points DESC, activeDays DESC, p.nickname ASC', requestedMonth, room.id);
      let rank = 0, previous = null;
      const result = rows.map((row, index) => { const key = `${row.points}:${row.activeDays}`; if (key !== previous) rank = index + 1; previous = key; return { ...row, avatar: decodeAvatar(row.avatar), rank, isMe: row.id === profile.public_id }; });
      return json({ month: requestedMonth, room, rows: result, myRank: result.find(r => r.isMe)?.rank || null, rules: '한국 시간 매월 1일 새로 시작합니다. 월 포인트, 학습일 수 순이며 두 값이 같으면 공동 순위입니다. 반에 가입한 뒤 얻은 포인트만 반 순위에 반영됩니다.' });
    }

    if (!userId) fail(401, 'sign_in_required', '로그인 후 이용해 주세요.');
    if (!profile) fail(409, 'profile_required', '먼저 나만의 캐릭터와 별명을 만들어 주세요.');

    if (request.method === 'POST' && ['/api/showcase', '/api/showcase/like', '/api/showcase/delete'].includes(url.pathname)) {
      const room = await activeRoom(db, userId, profile);
      if (!room) fail(409, 'room_required', '반을 만들거나 반 코드로 참여하면 작품을 함께 나눌 수 있어요.');
      if (url.pathname === '/api/showcase') {
        const sentence = cleanText(body.sentence, 300, '영어 문장');
        if (sentence.length < 5 || !/[a-z]/i.test(sentence)) fail(400, 'invalid_sentence', '영어 문장을 5~300자로 적어 주세요.');
        if (body.meaning !== undefined && typeof body.meaning !== 'string') fail(400, 'invalid_meaning', '우리말 뜻을 글자로 입력해 주세요.');
        const meaning = (body.meaning || '').trim();
        if (meaning.length > 300) fail(400, 'invalid_meaning', '우리말 뜻은 300자까지 적을 수 있어요.');
        if (!SHOWCASE_TAGS.includes(body.tag)) fail(400, 'invalid_tag', '자기소개, 회의·협업, 업무·목표 중 주제를 골라 주세요.');
        const id = crypto.randomUUID();
        // A single conditional insert enforces the daily limit under concurrent requests.
        // Deleted content still counts toward the three daily publication slots.
        await db.prepare('INSERT INTO showcase_posts (id, user_id, room_id, sentence, meaning, tag, local_date, created_at) SELECT ?, ?, ?, ?, ?, ?, ?, ? WHERE (SELECT COUNT(*) FROM showcase_posts WHERE user_id = ? AND local_date = ?) < 3').bind(id, userId, room.id, sentence, meaning, body.tag, today, now, userId, today).run();
        const post = await showcasePost(db, id, room.id, userId);
        if (!post) fail(429, 'post_limit', '작품은 하루 3개까지 나눌 수 있어요. 내일 또 새로운 문장을 들려주세요.');
        return json({ post, likesRemaining: await likesRemaining(db, userId, today), day: today }, 201);
      }
      if (typeof body.postId !== 'string' || body.postId.length > 100) fail(400, 'invalid_post', '작품을 다시 선택해 주세요.');
      const post = await showcasePost(db, body.postId, room.id, userId);
      if (!post) fail(404, 'post_not_found', '우리 반의 작품을 찾을 수 없어요.');
      if (url.pathname === '/api/showcase/delete') {
        if (!post.isMine) fail(403, 'not_post_owner', '내가 올린 작품만 삭제할 수 있어요.');
        await db.batch([
          db.prepare('DELETE FROM showcase_likes WHERE post_id = ? AND EXISTS (SELECT 1 FROM showcase_posts WHERE id = ? AND user_id = ? AND deleted_at IS NULL)').bind(post.id, post.id, userId),
          db.prepare("UPDATE showcase_posts SET sentence = '', meaning = '', deleted_at = ? WHERE id = ? AND user_id = ? AND deleted_at IS NULL").bind(now, post.id, userId)
        ]);
        return json({ deleted: true, postId: post.id, likesRemaining: await likesRemaining(db, userId, today) });
      }
      if (typeof body.liked !== 'boolean') fail(400, 'invalid_like', '응원 상태를 다시 선택해 주세요.');
      if (body.liked && post.isMine) fail(403, 'self_like', '다른 모험가의 문장에 응원을 보내 주세요.');
      if (body.liked) {
        // The cap applies across classes. Cancelling a heart dated today returns its slot.
        await db.prepare('INSERT OR IGNORE INTO showcase_likes (post_id, user_id, local_date, created_at) SELECT ?, ?, ?, ? WHERE (SELECT COUNT(*) FROM showcase_likes WHERE user_id = ? AND local_date = ?) < 5 AND EXISTS (SELECT 1 FROM showcase_posts WHERE id = ? AND room_id = ? AND user_id <> ? AND deleted_at IS NULL)').bind(post.id, userId, today, now, userId, today, post.id, room.id, userId).run();
      } else {
        await db.prepare('DELETE FROM showcase_likes WHERE post_id = ? AND user_id = ?').bind(post.id, userId).run();
      }
      const updated = await showcasePost(db, post.id, room.id, userId);
      if (!updated) fail(404, 'post_not_found', '이 작품은 삭제되었어요.');
      if (body.liked && !updated.liked) fail(429, 'like_limit', '오늘의 응원 하트 5개를 모두 보냈어요. 오늘 보낸 응원을 취소하면 다시 사용할 수 있어요.');
      return json({ postId: post.id, liked: updated.liked, likes: updated.likes, likesRemaining: await likesRemaining(db, userId, today) });
    }

    if (request.method === 'POST' && url.pathname === '/api/room') {
      if (body.action === 'create') {
        const name = cleanText(body.name, 30, '반 이름');
        const id = crypto.randomUUID();
        let code = '';
        const random = crypto.getRandomValues(new Uint8Array(6));
        for (const n of random) code += CODE_ALPHABET[n % CODE_ALPHABET.length];
        // Codes are allocated by a UNIQUE constraint. A very rare collision is safely retriable.
        await db.batch([
          db.prepare('INSERT INTO rooms (id, code, name, owner_id, created_at) VALUES (?, ?, ?, ?, ?)').bind(id, code, name, userId, now),
          db.prepare('INSERT INTO room_members (room_id, user_id, joined_at) VALUES (?, ?, ?)').bind(id, userId, now),
          db.prepare('UPDATE profiles SET current_room_id = ? WHERE user_id = ?').bind(id, userId)
        ]);
      } else if (body.action === 'join') {
        if (typeof body.code !== 'string' || !/^[A-HJ-NP-Z2-9]{6}$/.test(body.code.trim().toUpperCase())) fail(400, 'invalid_code', '6자리 반 코드를 확인해 주세요.');
        const room = await first(db, 'SELECT id FROM rooms WHERE code = ?', body.code.trim().toUpperCase());
        if (!room) fail(404, 'room_not_found', '해당 코드를 가진 반이 없습니다.');
        await db.batch([
          db.prepare('INSERT OR IGNORE INTO room_members (room_id, user_id, joined_at) VALUES (?, ?, ?)').bind(room.id, userId, now),
          db.prepare('UPDATE profiles SET current_room_id = ? WHERE user_id = ?').bind(room.id, userId)
        ]);
      } else fail(400, 'invalid_action', '반 만들기 또는 참여하기를 선택해 주세요.');
      profile = await first(db, 'SELECT * FROM profiles WHERE user_id = ?', userId);
      return json({ room: await activeRoom(db, userId, profile) });
    }

    if (request.method === 'POST' && url.pathname === '/api/shop') {
      const accessory = body.accessory;
      const cost = PRICES[accessory];
      if (!Number.isInteger(accessory) || !cost) fail(400, 'invalid_item', '구입할 소품을 다시 선택해 주세요.');
      if ((await owned(db, userId)).includes(accessory)) return json({ alreadyOwned: true, coins: profile.coins, owned: await owned(db, userId) });
      if (profile.coins < cost) fail(409, 'insufficient_coins', '코인이 조금 더 필요해요. 오늘의 미션에 도전해 보세요.');
      await db.batch([
        db.prepare('INSERT OR IGNORE INTO owned_items (user_id, item_id, purchased_at, charged) SELECT ?, ?, ?, 0 WHERE (SELECT coins FROM profiles WHERE user_id = ?) >= ?').bind(userId, String(accessory), now, userId, cost),
        db.prepare('UPDATE profiles SET coins = coins - ? WHERE user_id = ? AND EXISTS (SELECT 1 FROM owned_items WHERE user_id = ? AND item_id = ? AND charged = 0)').bind(cost, userId, userId, String(accessory)),
        db.prepare('UPDATE owned_items SET charged = 1 WHERE user_id = ? AND item_id = ? AND charged = 0').bind(userId, String(accessory))
      ]);
      const next = await first(db, 'SELECT coins FROM profiles WHERE user_id = ?', userId);
      const items = await owned(db, userId);
      if (!items.includes(accessory)) fail(409, 'insufficient_coins', '다른 구입으로 코인 잔액이 바뀌었어요. 다시 확인해 주세요.');
      return json({ coins: next.coins, owned: items, accessory });
    }

    if (request.method === 'POST' && url.pathname === '/api/session/start') {
      getLesson(courses, body.course, body.day);
      let existing = await first(db, 'SELECT * FROM learning_sessions WHERE user_id = ? AND local_date = ? AND finished_at IS NULL ORDER BY started_at DESC LIMIT 1', userId, today);
      if (body.replaceLegacyFruit === true && body.course === 'business' && existing?.course === 'fruit') {
        // Explicit replacement retires only this user's unfinished obsolete draft.
        // Rewarded or completed history is never changed, including a concurrent finish.
        await db.batch([
          db.prepare("DELETE FROM quiz_answers WHERE session_id = ? AND EXISTS (SELECT 1 FROM learning_sessions s WHERE s.id = ? AND s.user_id = ? AND s.course = 'fruit' AND s.finished_at IS NULL AND NOT EXISTS (SELECT 1 FROM learning_rewards r WHERE r.id = s.id))").bind(existing.id, existing.id, userId),
          db.prepare("DELETE FROM learning_sessions WHERE id = ? AND user_id = ? AND course = 'fruit' AND finished_at IS NULL AND NOT EXISTS (SELECT 1 FROM learning_rewards r WHERE r.id = learning_sessions.id)").bind(existing.id, userId)
        ]);
        existing = await first(db, 'SELECT * FROM learning_sessions WHERE user_id = ? AND local_date = ? AND finished_at IS NULL ORDER BY started_at DESC LIMIT 1', userId, today);
      }
      if (existing) return json({ session: await sessionView(db, existing, courses, now), resumed: true });
      const room = await activeRoom(db, userId, profile);
      const id = crypto.randomUUID();
      await db.prepare('INSERT OR IGNORE INTO learning_sessions (id, user_id, room_id, course, day, local_date, started_at,lesson_json,chapter_id) VALUES (?, ?, ?, ?, ?, ?, ?,?,?)').bind(id, userId, room?.id || null, body.course, body.day, today, now,JSON.stringify(getLesson(courses,body.course,body.day)),getLesson(courses,body.course,body.day).chapterId||null).run();
      const created = await first(db, 'SELECT * FROM learning_sessions WHERE user_id = ? AND local_date = ? AND finished_at IS NULL ORDER BY started_at DESC LIMIT 1', userId, today);
      return json({ session: await sessionView(db, created, courses, now), resumed: created?.id !== id });
    }

    if (request.method === 'POST' && url.pathname === '/api/session/quiz') {
      const session = await readSession(db, userId, body.sessionId);
      if (session.finished_at) fail(409, 'session_finished', '이미 마친 미션입니다.');
      const lesson = lessonForSession(session,courses);
      if (!Number.isInteger(body.index) || body.index < 0 || body.index >= lesson.quiz.length) fail(400, 'invalid_question', '문항을 다시 선택해 주세요.');
      const question = lesson.quiz[body.index];
      if (!Number.isInteger(body.answer) || body.answer < 0 || body.answer >= question.options.length) fail(400, 'invalid_answer', '선택지를 다시 골라 주세요.');
      const correct = Number(body.answer === question.answer);
      await db.prepare('INSERT OR IGNORE INTO quiz_answers (session_id, question_index, answer_index, correct, answered_at) VALUES (?, ?, ?, ?, ?)').bind(session.id, body.index, body.answer, correct, now).run();
      const saved = await first(db, 'SELECT answer_index AS answer, correct FROM quiz_answers WHERE session_id = ? AND question_index = ?', session.id, body.index);
      return json({ index: body.index, answer: saved.answer, correct: !!saved.correct, correctAnswer: question.answer, explanation: question.explanation });
    }

    if (request.method === 'POST' && url.pathname === '/api/session/speech') {
      const session = await readSession(db, userId, body.sessionId);
      if (session.finished_at) fail(409, 'session_finished', '이미 마친 미션입니다.');
      const lesson = lessonForSession(session,courses);
      if (!Number.isInteger(body.index) || body.index < 0 || body.index >= (lesson.phrases?.length || 0)) fail(400, 'invalid_phrase', '말하기 문장을 다시 선택해 주세요.');
      if (typeof body.transcript !== 'string' || !body.transcript.trim() || body.transcript.length > 1000) fail(400, 'invalid_transcript', '인식된 영어 문장을 확인한 뒤 다시 말해 주세요.');
      const expected = lesson.phrases[body.index].en;
      const transcript = body.transcript.trim();
      const result = compareSpeech(expected, transcript);
      if (result.passed) await db.prepare("UPDATE learning_sessions SET speech_json = CASE WHEN EXISTS (SELECT value FROM json_each(speech_json) WHERE value = ?) THEN speech_json ELSE json_insert(speech_json, '$[#]', ?) END WHERE id = ? AND user_id = ? AND finished_at IS NULL").bind(body.index, body.index, session.id, userId).run();
      const updated = await readSession(db, userId, session.id);
      return json({ ...result, expected, transcript, speechPassed: speechPasses(updated.speech_json) });
    }

    if (request.method === 'POST' && url.pathname === '/api/session/finish') {
      const session = await readSession(db, userId, body.sessionId);
      const lesson = lessonForSession(session,courses);
      const passedSpeech = speechPasses(session.speech_json);
      if (!(lesson.phrases?.length) || lesson.phrases.some((phrase,index) => !passedSpeech.includes(index))) fail(409, 'speech_incomplete', '말하기 3문장의 영어 인식 결과가 모두 일치해야 미션을 마칠 수 있어요.');
      const answerStats = await first(db, 'SELECT COUNT(*) AS total, COALESCE(SUM(correct),0) AS correct FROM quiz_answers WHERE session_id = ?', session.id);
      if (answerStats.total !== lesson.quiz.length) fail(409, 'quiz_incomplete', '퀴즈를 모두 풀면 미션을 마칠 수 있어요.');
      const reflection = typeof body.reflection === 'string' ? body.reflection.trim().slice(0, 500) : '';
      const seconds = session.finished_at ? session.elapsed_seconds : Math.min(1800, Math.max(0, Math.floor((now - session.started_at) / 1000)));
      const ratio = Math.min(1, seconds / 1200);
      const rewardRoom = await activeRoom(db, userId, profile);
      const points = Math.floor((80 + 20 * answerStats.correct / lesson.quiz.length) * ratio);
      // Reward date is the completion date; one reward per account per Korean calendar day.
      // These statements run atomically. The applied flag also makes replay/concurrent calls idempotent.
      await db.batch([
        db.prepare('UPDATE learning_sessions SET finished_at = ?, elapsed_seconds = ?, reflection = ?, room_id = ? WHERE id = ? AND user_id = ? AND finished_at IS NULL').bind(now, seconds, reflection, rewardRoom?.id || null, session.id, userId),
        db.prepare('INSERT OR IGNORE INTO learning_rewards (id, user_id, room_id, local_date, month, points, seconds, correct_answers, question_count, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(session.id, userId, rewardRoom?.id || null, today, month, points, Math.min(1200, seconds), answerStats.correct, lesson.quiz.length, now),
        db.prepare('UPDATE profiles SET total_points = total_points + (SELECT points FROM learning_rewards WHERE id = ? AND applied = 0), coins = coins + (SELECT CAST(points / 5 AS INTEGER) FROM learning_rewards WHERE id = ? AND applied = 0) WHERE user_id = ? AND EXISTS (SELECT 1 FROM learning_rewards WHERE id = ? AND applied = 0)').bind(session.id, session.id, userId, session.id),
        db.prepare('UPDATE learning_rewards SET applied = 1 WHERE id = ? AND applied = 0').bind(session.id)
      ]);
      const reward = await first(db, 'SELECT id, points, seconds, local_date AS date FROM learning_rewards WHERE user_id = ? AND local_date = ?', userId, today);
      profile = await first(db, 'SELECT * FROM profiles WHERE user_id = ?', userId);
      return json({ sessionId: session.id, points: reward?.id === session.id ? reward.points : 0, coins: reward?.id === session.id ? Math.floor(reward.points / 5) : 0, dailyPoints: reward?.points || 0, seconds, alreadyFinished: !!session.finished_at, dailyLimitReached: !!reward && reward.id !== session.id, user: userView(profile), rules: '하루 한 번 보상됩니다. 20분 학습과 퀴즈 정답 비율로 최대 100포인트·20코인을 받습니다. 학습 시간은 서버에서 시작부터 완료까지 측정하며 말하기 내용 자체를 평가하지 않습니다.' });
    }
    fail(404, 'not_found', '요청한 기능을 찾을 수 없습니다.');
  } catch (error) {
    if (error instanceof ApiError) return json({ error: error.code, message: error.message }, error.status);
    console.error('Learning API failed:', error?.name || 'Error');
    return json({ error: 'request_failed', message: '저장하지 못했어요. 잠시 후 다시 시도해 주세요.' }, 500);
  }
}

const DATA=[{"en": "What do you do?", "ko": "무슨 일을 하세요?", "note": "직업을 물을 때 쓰는 가장 자연스러운 질문입니다.", "cat": "자기소개", "kind": "표현"}, {"en": "Please call me JJ.", "ko": "JJ라고 불러 주세요.", "note": "call + 사람 + 이름", "cat": "자기소개", "kind": "표현"}, {"en": "Let me introduce myself.", "ko": "제 소개를 하겠습니다.", "note": "introduce myself: 나 자신을 소개하다", "cat": "자기소개", "kind": "표현"}, {"en": "I work in the public sector.", "ko": "저는 공공부문에서 일합니다.", "note": "분야에는 in, 회사 이름에는 for를 씁니다.", "cat": "자기소개", "kind": "표현"}, {"en": "I work in the Performance Management Department.", "ko": "저는 성과관리 부서에서 일합니다.", "note": "work in + 부서", "cat": "자기소개", "kind": "표현"}, {"en": "My company was established in 2004.", "ko": "우리 회사는 2004년에 설립되었습니다.", "note": "원문의 has established를 was established로 교정했습니다.", "cat": "자기소개", "kind": "표현"}, {"en": "How long have you worked for your company?", "ko": "회사에서 얼마나 오래 일하셨나요?", "note": "How long + 현재완료: 지금까지 이어진 기간", "cat": "자기소개", "kind": "표현"}, {"en": "I have worked here for 26 years.", "ko": "저는 이곳에서 26년 동안 일해 왔습니다.", "note": "기간에는 for, 시작 시점에는 since", "cat": "자기소개", "kind": "표현"}, {"en": "I work as a veterinary technician.", "ko": "저는 동물보건 분야의 테크니션으로 일합니다.", "note": "수의사 veterinarian과 구별합니다. 국내 법정 자격 명칭과는 다를 수 있습니다.", "cat": "직업·업무", "kind": "표현"}, {"en": "I work as a cook.", "ko": "저는 요리사로 일합니다.", "note": "work as + 직업", "cat": "직업·업무", "kind": "표현"}, {"en": "My responsibilities include preparing meals and washing dishes.", "ko": "제 담당업무에는 식사 준비와 설거지가 포함됩니다.", "note": "include 뒤에는 명사나 동명사", "cat": "직업·업무", "kind": "표현"}, {"en": "I am in charge of the education department.", "ko": "저는 교육부서를 맡고 있습니다.", "note": "be in charge of: ~을 담당하다", "cat": "직업·업무", "kind": "표현"}, {"en": "I teach the Bible to children.", "ko": "저는 아이들에게 성경을 가르칩니다.", "note": "teach A to B: B에게 A를 가르치다", "cat": "직업·업무", "kind": "표현"}, {"en": "I work as a freight forwarder.", "ko": "저는 국제운송 주선 업무를 합니다.", "note": "freight forwarder: 화물 운송 주선업자", "cat": "직업·업무", "kind": "표현"}, {"en": "We consolidate small shipments into one container.", "ko": "우리는 소량 화물을 모아 하나의 컨테이너에 싣습니다.", "note": "수업 속 화물 합적 설명을 자연스럽게 정리했습니다.", "cat": "직업·업무", "kind": "표현"}, {"en": "I am responsible for gathering performance data from each department.", "ko": "저는 각 부서의 실적 자료를 취합하는 일을 담당합니다.", "note": "be responsible for + 동명사", "cat": "직업·업무", "kind": "표현"}, {"en": "Please send me your annual performance data.", "ko": "연간 실적 자료를 보내 주세요.", "note": "업무 요청에 활용할 수 있는 학습용 문장", "cat": "직업·업무", "kind": "표현"}, {"en": "I used to work for a startup.", "ko": "저는 예전에 스타트업에서 일했습니다.", "note": "used to + 동사원형: 과거의 상태·습관", "cat": "직업·업무", "kind": "표현"}, {"en": "Why do you want to study English?", "ko": "왜 영어를 공부하고 싶으세요?", "note": "want to + 동사원형", "cat": "공부의 목적", "kind": "표현"}, {"en": "I want to communicate with people from other countries.", "ko": "저는 다른 나라 사람들과 소통하고 싶습니다.", "note": "communicate with + 사람", "cat": "공부의 목적", "kind": "표현"}, {"en": "I am interested in other cultures.", "ko": "저는 다른 문화에 관심이 있습니다.", "note": "be interested in + 명사", "cat": "공부의 목적", "kind": "표현"}, {"en": "I want to strengthen my professional skills.", "ko": "저는 전문 역량을 강화하고 싶습니다.", "note": "strengthen: 강화하다", "cat": "공부의 목적", "kind": "표현"}, {"en": "I want to share the gospel with more people.", "ko": "저는 더 많은 사람에게 복음을 전하고 싶습니다.", "note": "share A with B: B와 A를 나누다", "cat": "공부의 목적", "kind": "표현"}, {"en": "After I retire, I want to travel abroad with my wife.", "ko": "은퇴 후 아내와 해외여행을 하고 싶습니다.", "note": "after I retire: 은퇴한 후에", "cat": "공부의 목적", "kind": "표현"}, {"en": "I want to communicate with missionaries.", "ko": "저는 선교사들과 소통하고 싶습니다.", "note": "missionary의 복수형은 missionaries", "cat": "공부의 목적", "kind": "표현"}, {"en": "I want to become more fluent in English.", "ko": "저는 영어를 더 유창하게 하고 싶습니다.", "note": "be fluent in + 언어", "cat": "공부의 목적", "kind": "표현"}, {"en": "Having a specific goal is important.", "ko": "구체적인 목표를 갖는 것이 중요합니다.", "note": "동명사구가 주어일 때 단수 동사 is", "cat": "공부의 목적", "kind": "표현"}, {"en": "Consistency is important when learning English.", "ko": "영어를 배울 때 꾸준함이 중요합니다.", "note": "consistency: 꾸준함·일관성", "cat": "공부의 목적", "kind": "표현"}, {"en": "What is the most difficult part of your job?", "ko": "일하면서 가장 어려운 점은 무엇인가요?", "note": "원문의 challengeable 대신 difficult 또는 challenging", "cat": "어려움과 소통", "kind": "표현"}, {"en": "I find it difficult to collect data from other departments.", "ko": "다른 부서에서 자료를 모으는 것이 어렵습니다.", "note": "find it + 형용사 + to부정사", "cat": "어려움과 소통", "kind": "표현"}, {"en": "There is a generation gap.", "ko": "세대 차이가 있습니다.", "note": "generation gap: 세대 차이", "cat": "어려움과 소통", "kind": "표현"}, {"en": "I need to consult with their parents.", "ko": "저는 그들의 부모님과 상담해야 합니다.", "note": "consult with + 사람", "cat": "어려움과 소통", "kind": "표현"}, {"en": "We need to help students improve their grades.", "ko": "우리는 학생들의 성적 향상을 도와야 합니다.", "note": "help + 사람 + 동사원형", "cat": "어려움과 소통", "kind": "표현"}, {"en": "My colleague dumped his responsibilities on me.", "ko": "동료가 자신의 업무를 제게 떠넘겼습니다.", "note": "dump A on B: B에게 A를 떠넘기다. 원문의 to를 on으로 교정", "cat": "어려움과 소통", "kind": "표현"}, {"en": "I am the youngest member of the team.", "ko": "저는 팀에서 가장 어립니다.", "note": "the youngest: 가장 어린", "cat": "어려움과 소통", "kind": "표현"}, {"en": "I cannot stand it.", "ko": "저는 그것을 견딜 수 없습니다.", "note": "stand가 견디다라는 뜻으로 쓰인 문장", "cat": "어려움과 소통", "kind": "표현"}, {"en": "Feel free to ask any questions.", "ko": "편하게 어떤 질문이든 하세요.", "note": "Feel free to + 동사원형", "cat": "질문과 격려", "kind": "표현"}, {"en": "Take your time.", "ko": "천천히 하세요.", "note": "상대방을 재촉하지 않을 때", "cat": "질문과 격려", "kind": "표현"}, {"en": "Could you say that again?", "ko": "다시 말씀해 주시겠어요?", "note": "수업의 질문 권장 취지에 맞춘 추가 연습 표현", "cat": "질문과 격려", "kind": "표현"}, {"en": "Let’s move on to the next topic.", "ko": "다음 주제로 넘어갑시다.", "note": "move on to: ~로 넘어가다", "cat": "질문과 격려", "kind": "표현"}, {"en": "Keep it up!", "ko": "계속 잘해 나가세요!", "note": "잘하고 있는 행동을 계속하도록 격려", "cat": "질문과 격려", "kind": "표현"}, {"en": "Don’t give up.", "ko": "포기하지 마세요.", "note": "give up: 포기하다", "cat": "질문과 격려", "kind": "표현"}, {"en": "Cheer up!", "ko": "힘내세요!", "note": "기운을 북돋는 말", "cat": "질문과 격려", "kind": "표현"}, {"en": "Congratulations on your certificate!", "ko": "자격증 취득을 축하합니다!", "note": "원문의 for를 자연스러운 on으로 교정", "cat": "질문과 격려", "kind": "표현"}, {"en": "I appreciate this English class.", "ko": "이 영어 수업에 감사드립니다.", "note": "appreciate 뒤에 for 없이 대상을 바로 씁니다.", "cat": "질문과 격려", "kind": "표현"}, {"en": "I will pray for you.", "ko": "당신을 위해 기도하겠습니다.", "note": "pray for + 사람", "cat": "질문과 격려", "kind": "표현"}, {"en": "profession", "ko": "직업", "cat": "직업·업무", "note": "수업에 나온 핵심 어휘", "kind": "단어"}, {"en": "responsibility", "ko": "책임, 담당업무", "cat": "직업·업무", "note": "수업에 나온 핵심 어휘", "kind": "단어"}, {"en": "veterinarian", "ko": "수의사", "cat": "직업·업무", "note": "수업에 나온 핵심 어휘", "kind": "단어"}, {"en": "veterinary clinic", "ko": "동물병원", "cat": "직업·업무", "note": "수업에 나온 핵심 어휘", "kind": "단어"}, {"en": "veterinary technician", "ko": "동물 진료를 보조하는 전문인력", "cat": "직업·업무", "note": "수업에 나온 핵심 어휘", "kind": "단어"}, {"en": "preparation", "ko": "준비", "cat": "직업·업무", "note": "수업에 나온 핵심 어휘", "kind": "단어"}, {"en": "chop", "ko": "잘게 썰다", "cat": "직업·업무", "note": "수업에 나온 핵심 어휘", "kind": "단어"}, {"en": "slice", "ko": "얇게 썰다", "cat": "직업·업무", "note": "수업에 나온 핵심 어휘", "kind": "단어"}, {"en": "freight forwarder", "ko": "화물 운송 주선업자", "cat": "직업·업무", "note": "수업에 나온 핵심 어휘", "kind": "단어"}, {"en": "shipment", "ko": "운송 화물, 선적", "cat": "직업·업무", "note": "수업에 나온 핵심 어휘", "kind": "단어"}, {"en": "cargo", "ko": "화물", "cat": "직업·업무", "note": "수업에 나온 핵심 어휘", "kind": "단어"}, {"en": "export", "ko": "수출, 수출하다", "cat": "직업·업무", "note": "수업에 나온 핵심 어휘", "kind": "단어"}, {"en": "import", "ko": "수입, 수입하다", "cat": "직업·업무", "note": "수업에 나온 핵심 어휘", "kind": "단어"}, {"en": "LCL", "ko": "컨테이너 한 대를 채우지 못하는 소량 화물", "cat": "직업·업무", "note": "수업에 나온 핵심 어휘", "kind": "단어"}, {"en": "public sector", "ko": "공공부문", "cat": "자기소개", "note": "수업에 나온 핵심 어휘", "kind": "단어"}, {"en": "department", "ko": "부서", "cat": "자기소개", "note": "수업에 나온 핵심 어휘", "kind": "단어"}, {"en": "establish", "ko": "설립하다", "cat": "자기소개", "note": "수업에 나온 핵심 어휘", "kind": "단어"}, {"en": "employ", "ko": "고용하다", "cat": "자기소개", "note": "수업에 나온 핵심 어휘", "kind": "단어"}, {"en": "startup", "ko": "신생기업, 스타트업", "cat": "직업·업무", "note": "수업에 나온 핵심 어휘", "kind": "단어"}, {"en": "developer", "ko": "개발자", "cat": "직업·업무", "note": "수업에 나온 핵심 어휘", "kind": "단어"}, {"en": "abbreviation", "ko": "약어", "cat": "직업·업무", "note": "수업에 나온 핵심 어휘", "kind": "단어"}, {"en": "replace", "ko": "대체하다", "cat": "직업·업무", "note": "수업에 나온 핵심 어휘", "kind": "단어"}, {"en": "motive", "ko": "동기", "cat": "공부의 목적", "note": "수업에 나온 핵심 어휘", "kind": "단어"}, {"en": "specific", "ko": "구체적인", "cat": "공부의 목적", "note": "수업에 나온 핵심 어휘", "kind": "단어"}, {"en": "consistency", "ko": "꾸준함, 일관성", "cat": "공부의 목적", "note": "수업에 나온 핵심 어휘", "kind": "단어"}, {"en": "persistence", "ko": "끈기", "cat": "공부의 목적", "note": "수업에 나온 핵심 어휘", "kind": "단어"}, {"en": "strengthen", "ko": "강화하다", "cat": "공부의 목적", "note": "수업에 나온 핵심 어휘", "kind": "단어"}, {"en": "expand", "ko": "넓히다, 확장하다", "cat": "공부의 목적", "note": "수업에 나온 핵심 어휘", "kind": "단어"}, {"en": "range", "ko": "범위", "cat": "공부의 목적", "note": "수업에 나온 핵심 어휘", "kind": "단어"}, {"en": "fluent", "ko": "유창한", "cat": "공부의 목적", "note": "수업에 나온 핵심 어휘", "kind": "단어"}, {"en": "potential", "ko": "잠재력", "cat": "공부의 목적", "note": "수업에 나온 핵심 어휘", "kind": "단어"}, {"en": "retirement", "ko": "은퇴", "cat": "공부의 목적", "note": "수업에 나온 핵심 어휘", "kind": "단어"}, {"en": "missionary", "ko": "선교사", "cat": "공부의 목적", "note": "수업에 나온 핵심 어휘", "kind": "단어"}, {"en": "evangelist", "ko": "복음 전도자", "cat": "공부의 목적", "note": "수업에 나온 핵심 어휘", "kind": "단어"}, {"en": "proclaim", "ko": "선포하다, 전하다", "cat": "공부의 목적", "note": "수업에 나온 핵심 어휘", "kind": "단어"}, {"en": "gospel", "ko": "복음", "cat": "공부의 목적", "note": "수업에 나온 핵심 어휘", "kind": "단어"}, {"en": "encourage", "ko": "격려하다", "cat": "질문과 격려", "note": "수업에 나온 핵심 어휘", "kind": "단어"}, {"en": "terminology", "ko": "전문용어", "cat": "질문과 격려", "note": "수업에 나온 핵심 어휘", "kind": "단어"}, {"en": "paperwork", "ko": "서류 업무", "cat": "어려움과 소통", "note": "수업에 나온 핵심 어휘", "kind": "단어"}, {"en": "administrative work", "ko": "행정 업무", "cat": "어려움과 소통", "note": "수업에 나온 핵심 어휘", "kind": "단어"}, {"en": "strength", "ko": "강점, 힘", "cat": "어려움과 소통", "note": "수업에 나온 핵심 어휘", "kind": "단어"}, {"en": "weakness", "ko": "약점", "cat": "어려움과 소통", "note": "수업에 나온 핵심 어휘", "kind": "단어"}, {"en": "certificate", "ko": "자격증, 증명서", "cat": "어려움과 소통", "note": "수업에 나온 핵심 어휘", "kind": "단어"}, {"en": "bullying", "ko": "괴롭힘", "cat": "어려움과 소통", "note": "수업에 나온 핵심 어휘", "kind": "단어"}, {"en": "heartbreaking", "ko": "가슴 아픈", "cat": "어려움과 소통", "note": "수업에 나온 핵심 어휘", "kind": "단어"}, {"en": "consult", "ko": "상담하다, 상의하다", "cat": "어려움과 소통", "note": "수업에 나온 핵심 어휘", "kind": "단어"}, {"en": "recover", "ko": "회복하다", "cat": "어려움과 소통", "note": "수업에 나온 핵심 어휘", "kind": "단어"}, {"en": "encounter", "ko": "마주치다, 직면하다", "cat": "어려움과 소통", "note": "수업에 나온 핵심 어휘", "kind": "단어"}, {"en": "generation gap", "ko": "세대 차이", "cat": "어려움과 소통", "note": "수업에 나온 핵심 어휘", "kind": "단어"}, {"en": "senior executive", "ko": "고위 임원", "cat": "직업·업무", "note": "수업에 나온 핵심 어휘", "kind": "단어"}, {"en": "gather", "ko": "모으다, 취합하다", "cat": "어려움과 소통", "note": "수업에 나온 핵심 어휘", "kind": "단어"}, {"en": "congregation", "ko": "회중, 신도들의 모임", "cat": "공부의 목적", "note": "수업에 나온 핵심 어휘", "kind": "단어"}, {"en": "confess", "ko": "고백하다", "cat": "어려움과 소통", "note": "수업에 나온 핵심 어휘", "kind": "단어"}, {"en": "colleague", "ko": "직장 동료", "cat": "어려움과 소통", "note": "수업에 나온 핵심 어휘", "kind": "단어"}, {"en": "enthusiastic", "ko": "열정적인", "cat": "어려움과 소통", "note": "수업에 나온 핵심 어휘", "kind": "단어"}, {"en": "passionate", "ko": "열정적인", "cat": "어려움과 소통", "note": "수업에 나온 핵심 어휘", "kind": "단어"}, {"en": "analyze", "ko": "분석하다", "cat": "직업·업무", "note": "수업에 나온 핵심 어휘", "kind": "단어"}, {"en": "daily life", "ko": "일상생활", "cat": "공부의 목적", "note": "수업에 나온 핵심 어휘", "kind": "단어"}, {"en": "conglomerate", "ko": "여러 사업을 운영하는 대기업 집단", "cat": "직업·업무", "note": "수업에 나온 핵심 어휘", "kind": "단어"}, {"en": "retreat", "ko": "수련회", "cat": "공부의 목적", "note": "수업에 나온 핵심 어휘", "kind": "단어"}];
const DAYS = [
  {
    id: 1, title: "자기소개", subtitle: "이름과 하는 일을 편하게 말해요", icon: "👋",
    phrases: [
      { en: "Let me introduce myself.", ko: "제 소개를 하겠습니다.", note: "첫 문장으로 말문을 열어 보세요. introduce myself는 ‘나 자신을 소개하다’예요." },
      { en: "Please call me JJ.", ko: "JJ라고 불러 주세요.", note: "JJ 대신 내가 불리고 싶은 이름을 넣어요." },
      { en: "What do you do?", ko: "무슨 일을 하세요?", note: "직업을 물을 때 쓰는 자연스러운 질문이에요." }
    ],
    dialogue: [
      { speaker: "A", en: "Let me introduce myself. Please call me JJ.", ko: "제 소개를 할게요. JJ라고 불러 주세요." },
      { speaker: "B", en: "Nice to meet you, JJ. What do you do?", ko: "만나서 반가워요, JJ. 무슨 일을 하세요?" },
      { speaker: "A", en: "I work in the public sector. How about you?", ko: "저는 공공부문에서 일해요. 당신은요?" },
      { speaker: "B", en: "I work as a cook.", ko: "저는 요리사로 일해요." }
    ],
    prompt: "내 이름과 하는 일을 2~3문장으로 소개해 보세요. 예시의 이름과 직업을 내 이야기로 바꿔요.",
    example: "Let me introduce myself. Please call me JJ. I work in the public sector.",
    quiz: [
      { q: "상대방의 직업을 물을 때는?", options: ["Where do you go?", "What do you do?", "How old are you?"], answer: 1, explanation: "What do you do?는 어떤 일을 하는지 묻는 표현이에요." },
      { q: "‘JJ라고 불러 주세요.’에 맞는 문장은?", options: ["Please call me JJ.", "Please say me JJ.", "Please name to JJ."], answer: 0, explanation: "call + 사람 + 이름 순서예요. 이름만 바꿔 바로 사용할 수 있어요." },
      { q: "‘Let me introduce myself.’의 뜻은?", options: ["먼저 가겠습니다.", "질문해도 될까요?", "제 소개를 하겠습니다."], answer: 2, explanation: "자기소개를 시작할 때 쓸 수 있는 문장이에요." }
    ]
  },
  {
    id: 2, title: "내 일 소개", subtitle: "직업에서 담당업무까지 한 걸음 더", icon: "💼",
    phrases: [
      { en: "I work as a cook.", ko: "저는 요리사로 일합니다.", note: "work as 뒤에는 직업을 넣어요. a developer처럼 바꿔 말해 보세요." },
      { en: "My responsibilities include preparing meals and washing dishes.", ko: "제 담당업무에는 식사 준비와 설거지가 포함됩니다.", note: "include 뒤에는 preparing, washing처럼 활동을 나타내는 -ing 형태를 쓸 수 있어요." },
      { en: "I am in charge of the education department.", ko: "저는 교육부서를 맡고 있습니다.", note: "be in charge of는 ‘~을 담당하다’라는 뜻이에요." }
    ],
    dialogue: [
      { speaker: "A", en: "What do you do?", ko: "무슨 일을 하세요?" },
      { speaker: "B", en: "I work as a cook.", ko: "저는 요리사로 일해요." },
      { speaker: "A", en: "What are your responsibilities?", ko: "어떤 업무를 담당하세요?" },
      { speaker: "B", en: "My responsibilities include preparing meals and washing dishes.", ko: "식사 준비와 설거지 등을 담당해요." }
    ],
    prompt: "내 직업과 담당하는 일 하나를 말해 보세요. 현재 하는 일이 없다면 해보고 싶은 직업으로 연습해도 좋아요.",
    example: "I work as a developer. My responsibilities include building websites.",
    quiz: [
      { q: "‘저는 요리사로 일해요.’를 완성해 보세요. I work ___ a cook.", options: ["in", "for", "as"], answer: 2, explanation: "직업 앞에는 as를 써요. 분야는 in, 고용주는 for와 함께 쓸 수 있어요." },
      { q: "‘I am in charge of ...’의 뜻은?", options: ["저는 …을 담당해요.", "저는 …을 기다려요.", "저는 …을 처음 봐요."], answer: 0, explanation: "in charge of는 책임지고 담당한다는 뜻이에요." },
      { q: "‘담당업무’를 뜻하는 단어는?", options: ["cultures", "responsibilities", "certificates"], answer: 1, explanation: "responsibilities는 책임이나 담당하는 업무를 뜻해요." }
    ]
  },
  {
    id: 3, title: "영어를 배우는 이유", subtitle: "내 목표를 말하면 연습이 더 선명해져요", icon: "🎯",
    phrases: [
      { en: "Why do you want to study English?", ko: "왜 영어를 공부하고 싶으세요?", note: "이유를 물을 때 Why로 시작해요." },
      { en: "I want to communicate with people from other countries.", ko: "저는 다른 나라 사람들과 소통하고 싶습니다.", note: "want to + 동사원형. communicate with 뒤에는 소통할 사람을 넣어요." },
      { en: "I am interested in other cultures.", ko: "저는 다른 문화에 관심이 있습니다.", note: "be interested in은 ‘~에 관심이 있다’라는 뜻이에요." }
    ],
    dialogue: [
      { speaker: "A", en: "Why do you want to study English?", ko: "왜 영어를 공부하고 싶으세요?" },
      { speaker: "B", en: "I want to communicate with people from other countries.", ko: "다른 나라 사람들과 소통하고 싶어요." },
      { speaker: "A", en: "Are you interested in other cultures?", ko: "다른 문화에 관심이 있으세요?" },
      { speaker: "B", en: "Yes, I am interested in other cultures.", ko: "네, 다른 문화에 관심이 있어요." }
    ],
    prompt: "영어를 배우는 나만의 이유를 말해 보세요. 여행, 일, 소통 중 하나를 골라 시작해도 좋아요.",
    example: "I want to communicate with people from other countries. I am interested in other cultures.",
    quiz: [
      { q: "‘~하고 싶어요.’를 말하는 기본 형태는?", options: ["I want + -ing", "I want to + 동사원형", "I want for + 동사원형"], answer: 1, explanation: "I want to travel.처럼 want to 뒤에 동사원형을 써요." },
      { q: "‘다른 문화에 관심이 있어요.’에 맞는 문장은?", options: ["I am interested at other cultures.", "I am interest other cultures.", "I am interested in other cultures."], answer: 2, explanation: "be interested in을 한 덩어리로 기억해 보세요." },
      { q: "‘communicate with people’의 뜻은?", options: ["사람들과 소통하다", "사람들을 고용하다", "사람들을 기다리다"], answer: 0, explanation: "communicate는 소통하다, with people은 사람들과라는 뜻이에요." }
    ]
  },
  {
    id: 4, title: "천천히 다시 말하기", subtitle: "못 들었을 때도 대화를 이어갈 수 있어요", icon: "🔁",
    phrases: [
      { en: "Could you say that again?", ko: "다시 말씀해 주시겠어요?", note: "놓친 말을 정중하게 다시 부탁하는 표현이에요." },
      { en: "Take your time.", ko: "천천히 하세요.", note: "서두르지 않아도 된다고 상대방을 격려할 때 써요." },
      { en: "Feel free to ask any questions.", ko: "편하게 어떤 질문이든 하세요.", note: "Feel free to + 동사원형은 편하게 ~하라는 뜻이에요." }
    ],
    dialogue: [
      { speaker: "A", en: "What is the most difficult part of your job?", ko: "일하면서 가장 어려운 점은 무엇인가요?" },
      { speaker: "B", en: "Could you say that again? Could you speak more slowly?", ko: "다시 말씀해 주시겠어요? 조금 더 천천히 말씀해 주시겠어요?" },
      { speaker: "A", en: "Of course. What is difficult about your job? Take your time.", ko: "물론이죠. 일하면서 어떤 점이 어려운가요? 천천히 하세요." },
      { speaker: "B", en: "I find it difficult to collect data from other departments.", ko: "다른 부서에서 자료를 모으는 것이 어려워요." }
    ],
    prompt: "질문을 잘 못 들은 상황을 떠올려 보세요. 다시 말해 달라고 부탁하고, 천천히 답해 보세요.",
    example: "Could you say that again? Could you speak more slowly? I work in the public sector.",
    quiz: [
      { q: "못 들은 말을 다시 부탁할 때는?", options: ["Could you say that again?", "Let’s move on.", "Congratulations!"], answer: 0, explanation: "Could you say that again?은 다시 말해 달라는 정중한 요청이에요." },
      { q: "‘Take your time.’은 어떤 상황에 어울릴까요?", options: ["빨리 하라고 재촉할 때", "시간을 물어볼 때", "천천히 답해도 된다고 격려할 때"], answer: 2, explanation: "상대방이 생각하거나 준비할 시간을 주는 표현이에요." },
      { q: "‘Feel free to ask any questions.’의 뜻은?", options: ["질문은 나중에 하세요.", "편하게 어떤 질문이든 하세요.", "제 질문에 답해 주세요."], answer: 1, explanation: "Feel free to는 부담 없이 편하게 해도 좋다는 뜻이에요." }
    ]
  },
  {
    id: 5, title: "질문 이어가기", subtitle: "질문 하나를 더하면 대화가 길어져요", icon: "💬",
    phrases: [
      { en: "What do you do?", ko: "무슨 일을 하세요?", note: "Day 1 표현을 다시 꺼내 말해 보세요." },
      { en: "How long have you worked for your company?", ko: "회사에서 얼마나 오래 일하셨나요?", note: "How long은 기간을 물어요. 지금까지 이어진 근무 기간을 묻는 질문이에요." },
      { en: "What is the most difficult part of your job?", ko: "일하면서 가장 어려운 점은 무엇인가요?", note: "the most difficult part는 ‘가장 어려운 부분’이에요." }
    ],
    dialogue: [
      { speaker: "A", en: "How long have you worked for your company?", ko: "회사에서 얼마나 오래 일하셨나요?" },
      { speaker: "B", en: "I have worked here for five years.", ko: "이곳에서 5년 동안 일해 왔어요." },
      { speaker: "A", en: "What is the most difficult part of your job?", ko: "일하면서 가장 어려운 점은 무엇인가요?" },
      { speaker: "B", en: "I find it difficult to collect data from other departments.", ko: "다른 부서에서 자료를 모으는 것이 어려워요." }
    ],
    prompt: "직업 → 근무 기간 → 어려운 점 순서로 질문 3개를 말해 보세요. 상대 역할의 답도 직접 해보면 더 좋아요.",
    example: "What do you do? How long have you worked for your company? What is the most difficult part of your job?",
    quiz: [
      { q: "‘How long’은 무엇을 물을 때 쓰나요?", options: ["가격", "장소", "기간"], answer: 2, explanation: "얼마나 오랫동안인지, 기간을 묻는 표현이에요." },
      { q: "‘5년 동안’을 완성해 보세요. ___ five years", options: ["since", "for", "at"], answer: 1, explanation: "기간에는 for를 써요. since는 since 2020처럼 시작 시점 앞에 써요." },
      { q: "‘the most difficult part’의 뜻은?", options: ["가장 어려운 부분", "가장 새로운 부서", "가장 긴 시간"], answer: 0, explanation: "most difficult는 가장 어렵다는 뜻이에요." }
    ]
  },
  {
    id: 6, title: "나의 이야기", subtitle: "일과 목표를 연결해 짧은 이야기를 만들어요", icon: "📖",
    phrases: [
      { en: "I used to work for a startup.", ko: "저는 예전에 스타트업에서 일했습니다.", note: "used to + 동사원형으로 과거의 상태나 습관을 말해요." },
      { en: "I am responsible for gathering performance data from each department.", ko: "저는 각 부서의 실적 자료를 취합하는 일을 담당합니다.", note: "be responsible for 뒤에는 gathering처럼 -ing 형태를 쓸 수 있어요." },
      { en: "I want to become more fluent in English.", ko: "저는 영어를 더 유창하게 하고 싶습니다.", note: "fluent in English는 영어를 유창하게 한다는 뜻이에요." }
    ],
    dialogue: [
      { speaker: "A", en: "Tell me a little about yourself.", ko: "본인에 대해 조금 이야기해 주세요." },
      { speaker: "B", en: "I used to work for a startup. Now I work in the public sector.", ko: "예전에 스타트업에서 일했어요. 지금은 공공부문에서 일해요." },
      { speaker: "A", en: "Why do you want to study English?", ko: "왜 영어를 공부하고 싶으세요?" },
      { speaker: "B", en: "I want to become more fluent in English and communicate with people from other countries.", ko: "영어를 더 유창하게 하고, 다른 나라 사람들과 소통하고 싶어요." }
    ],
    prompt: "과거에 한 일, 지금 하는 일, 영어 학습 목표를 연결해 30초 동안 말해 보세요. 예시의 경력 대신 내 경험을 넣어요.",
    example: "I used to work for a startup. Now I work as a developer. I want to become more fluent in English.",
    quiz: [
      { q: "‘I used to work for a startup.’이 말하는 것은?", options: ["앞으로 할 일", "예전에 했던 일", "지금 주문할 음식"], answer: 1, explanation: "used to work는 예전에 일했다는 뜻이에요." },
      { q: "‘자료 취합을 담당해요.’를 완성해 보세요. I am responsible for ___ data.", options: ["gathering", "gather", "to gather"], answer: 0, explanation: "전치사 for 뒤에는 gathering처럼 -ing 형태를 써요." },
      { q: "‘영어를 더 유창하게 하고 싶어요.’에 맞는 문장은?", options: ["I used to study English.", "I am interested in paperwork.", "I want to become more fluent in English."], answer: 2, explanation: "want to become more fluent는 더 유창해지고 싶다는 뜻이에요." }
    ]
  },
  {
    id: 7, title: "주간 챌린지", subtitle: "일주일의 표현으로 1분 말하기", icon: "🏆",
    phrases: [
      { en: "Let me introduce myself.", ko: "제 소개를 하겠습니다.", note: "첫날 표현으로 시작해 보세요. 이번에는 화면을 보지 않고 말해 볼까요?" },
      { en: "Consistency is important when learning English.", ko: "영어를 배울 때 꾸준함이 중요합니다.", note: "consistency는 꾸준함이에요. 매일 조금씩 말하는 나를 응원해요." },
      { en: "Keep it up!", ko: "계속 잘해 나가세요!", note: "함께 연습한 상대방과 나에게 건네는 격려예요." }
    ],
    dialogue: [
      { speaker: "A", en: "Let me introduce myself. I work in the public sector.", ko: "제 소개를 할게요. 저는 공공부문에서 일해요." },
      { speaker: "B", en: "Why do you want to study English?", ko: "왜 영어를 공부하고 싶으세요?" },
      { speaker: "A", en: "I want to communicate with people from other countries. I practice every day.", ko: "다른 나라 사람들과 소통하고 싶어요. 매일 연습해요." },
      { speaker: "B", en: "Consistency is important when learning English. Keep it up!", ko: "영어를 배울 때 꾸준함이 중요해요. 계속 잘해 나가세요!" }
    ],
    prompt: "자기소개 → 내 일과 담당업무 → 영어를 배우는 이유를 연결해 1분 동안 말해 보세요. 30초부터 시작해도 좋아요. 마지막에는 나에게 Keep it up!이라고 말해요.",
    example: "Let me introduce myself. Please call me JJ. I work in the public sector. I am responsible for gathering performance data. I want to communicate with people from other countries. Keep it up!",
    quiz: [
      { q: "일주일 복습! 이름을 알려주며 불러 달라고 할 때는?", options: ["Please call me JJ.", "Please work as JJ.", "Please give up JJ."], answer: 0, explanation: "Please call me + 이름. 이제 내 이름을 넣어 소리 내어 말해 보세요." },
      { q: "일주일 복습! ‘다시 말씀해 주시겠어요?’는?", options: ["Take your time.", "Keep it up!", "Could you say that again?"], answer: 2, explanation: "다시 부탁하는 것도 대화를 이어가는 중요한 말하기 기술이에요." },
      { q: "‘Consistency’의 뜻은?", options: ["자격증", "꾸준함", "직업"], answer: 1, explanation: "consistency는 꾸준함이에요. 매일 조금씩 말하는 연습을 이어가요." }
    ]
  }
];

// Primary course: uploaded Business_English_Conversation_60_Minutes.pdf.
// Full-sentence examples and roleplays are learning adaptations of its patterns.
// Additional workplace idioms and news vocabulary come from the uploaded images.
// The PDF's date-specific “By February” goal is adapted to a rolling three-month goal.
const BUSINESS_DAYS = [
  {
    id: 1, title: "수업에 온 나의 이유", subtitle: "수강 동기와 말하기 자신감을 이야기해요", icon: "👋",
    phrases: [
      { en: "I signed up because I want to feel more confident speaking English.", ko: "영어로 말할 때 더 자신감을 갖고 싶어서 신청했어요.", note: "PDF Toolkit 1의 I signed up because… 패턴. because 뒤에 신청한 이유를 넣어요." },
      { en: "I'd like to build my confidence in speaking with international clients.", ko: "해외 고객과 말하는 데 자신감을 키우고 싶어요.", note: "build my confidence in + 명사/-ing. clients를 colleagues나 presentations로 바꿔도 좋아요." },
      { en: "My biggest challenge is finding time to practice.", ko: "가장 큰 어려움은 연습할 시간을 내는 거예요.", note: "My biggest challenge is… 뒤에 내 어려움을 넣어요." }
    ],
    dialogue: [
      { speaker: "A", en: "What made you decide to join this class?", ko: "어떤 계기로 이 수업에 참여하게 됐나요?" },
      { speaker: "B", en: "I signed up because I want to feel more confident speaking English.", ko: "영어로 말할 때 더 자신감을 갖고 싶어서 신청했어요." },
      { speaker: "A", en: "What has stopped you from studying English before?", ko: "그동안 영어 공부를 어렵게 만든 것은 무엇이었나요?" },
      { speaker: "B", en: "My biggest challenge is finding time to practice.", ko: "가장 큰 어려움은 연습할 시간을 내는 거예요." }
    ],
    prompt: "수업에 참여한 이유와 가장 큰 어려움을 말해 보세요. 예시의 이유와 어려움을 내 상황으로 바꿔요.",
    example: "I signed up because I want to speak with more confidence. My biggest challenge is finding time to practice. I'd like to practice for twenty minutes every day.",
    quiz: [
      { q: "‘I signed up because…’ 뒤에는 어떤 내용이 올까요?", options: ["수업에 신청한 이유", "현재 시각", "상대방의 이름만"], answer: 0, explanation: "because는 ‘~하기 때문에’예요. 신청한 이유를 덧붙여요." },
      { q: "‘build my confidence’의 뜻은?", options: ["건물을 짓다", "자신감을 키우다", "일정을 바꾸다"], answer: 1, explanation: "build confidence는 자신감을 키우다라는 뜻이에요." },
      { q: "가장 큰 어려움을 설명하는 문장은?", options: ["I work in marketing.", "One major advantage is flexibility.", "My biggest challenge is finding time to practice."], answer: 2, explanation: "My biggest challenge is… 패턴으로 내 어려움을 설명할 수 있어요." }
    ]
  },
  {
    id: 2, title: "나의 영어 목표", subtitle: "영어가 만들어 줄 기회를 구체적으로 그려요", icon: "🎯",
    phrases: [
      { en: "My long-term goal is to work with global teams.", ko: "장기 목표는 글로벌 팀과 함께 일하는 거예요.", note: "PDF Toolkit 2의 My long-term goal is to… 뒤에 동사원형을 넣어요." },
      { en: "It would open up opportunities to work abroad.", ko: "해외에서 일할 기회를 열어 줄 거예요.", note: "open up opportunities는 새로운 기회를 열어 주다라는 뜻이에요. 여기서 It은 영어 실력 향상을 가리켜요." },
      { en: "I want to become more fluent in English.", ko: "영어를 더 유창하게 하고 싶어요.", note: "fluent in + 언어. 어떤 언어를 유창하게 하는지 말해요." }
    ],
    dialogue: [
      { speaker: "A", en: "What is your main motivation for learning English?", ko: "영어를 배우는 가장 큰 동기는 무엇인가요?" },
      { speaker: "B", en: "My long-term goal is to work with global teams.", ko: "장기 목표는 글로벌 팀과 함께 일하는 거예요." },
      { speaker: "A", en: "What opportunities could better English create?", ko: "영어 실력이 좋아지면 어떤 기회가 생길까요?" },
      { speaker: "B", en: "It would open up opportunities to work abroad. I want to become more fluent in English.", ko: "해외에서 일할 기회를 열어 줄 거예요. 영어를 더 유창하게 하고 싶어요." }
    ],
    prompt: "나의 장기 목표와 영어가 도와줄 일을 말해 보세요. 앞으로 3개월 안에 할 수 있게 되고 싶은 것도 하나 정해요.",
    example: "My long-term goal is to work with global teams. In the next three months, I want to be able to introduce my work in English for one minute.",
    quiz: [
      { q: "‘장기 목표’를 뜻하는 표현은?", options: ["daily routine", "long-term goal", "biggest challenge"], answer: 1, explanation: "long-term은 장기적인, goal은 목표라는 뜻이에요." },
      { q: "‘새로운 기회를 열어 주다’는?", options: ["open up opportunities", "take a break", "find a deadline"], answer: 0, explanation: "open up opportunities는 가능한 기회나 선택지를 넓혀 준다는 뜻이에요." },
      { q: "문장을 완성해 보세요. I want to become more fluent ___ English.", options: ["at", "on", "in"], answer: 2, explanation: "언어를 유창하게 한다고 말할 때 fluent in English라고 해요." }
    ]
  },
  {
    id: 3, title: "내 일과 담당업무", subtitle: "직업과 하루의 일을 자연스럽게 소개해요", icon: "💼",
    phrases: [
      { en: "I work in marketing.", ko: "저는 마케팅 분야에서 일해요.", note: "PDF Toolkit 3. 분야는 work in, 직업은 work as a developer처럼 말해요." },
      { en: "I'm responsible for planning campaigns.", ko: "저는 캠페인 기획을 담당해요.", note: "be responsible for + 명사/-ing. planning을 내 업무로 바꿔 보세요." },
      { en: "My role involves analyzing customer data.", ko: "제 역할에는 고객 데이터 분석이 포함돼요.", note: "involve 뒤에 활동을 말할 때는 analyzing처럼 -ing 형태를 써요." }
    ],
    dialogue: [
      { speaker: "A", en: "What do you do for a living?", ko: "어떤 일을 하시나요?" },
      { speaker: "B", en: "I work in marketing. I'm responsible for planning campaigns.", ko: "마케팅 분야에서 일해요. 캠페인 기획을 담당해요." },
      { speaker: "A", en: "What does a typical workday look like?", ko: "보통 하루 업무는 어떻게 되나요?" },
      { speaker: "B", en: "My role involves analyzing customer data and meeting with colleagues.", ko: "고객 데이터를 분석하고 동료들과 회의하는 일을 해요." }
    ],
    prompt: "내 직업이나 분야, 담당업무 두 가지를 말해 보세요. 예시는 마케팅 업무이므로 내 경험에 맞게 바꿔요.",
    example: "I work as a developer. I'm responsible for building websites. My role involves solving problems and working with a team.",
    quiz: [
      { q: "‘저는 마케팅 분야에서 일해요.’를 완성해 보세요. I work ___ marketing.", options: ["as", "to", "in"], answer: 2, explanation: "분야를 말할 때는 work in을 써요. 직업을 말할 때는 work as를 써요." },
      { q: "‘캠페인 기획을 담당해요.’에 맞는 문장은?", options: ["I'm responsible for planning campaigns.", "I'm responsible to planning campaigns.", "I'm responsible for plan campaigns."], answer: 0, explanation: "responsible for 뒤에는 planning처럼 -ing 형태를 쓸 수 있어요." },
      { q: "‘What does a typical workday look like?’가 묻는 것은?", options: ["사무실의 색깔", "보통 하루의 업무 내용", "주말 여행 계획"], answer: 1, explanation: "typical workday는 보통의 근무일이에요. 일상적인 업무 흐름을 말해 보세요." }
    ]
  },
  {
    id: 4, title: "일의 보람과 어려움", subtitle: "좋은 점과 아쉬운 점을 균형 있게 말해요", icon: "⚖️",
    phrases: [
      { en: "One major advantage is the flexibility.", ko: "큰 장점 중 하나는 유연성이에요.", note: "PDF Toolkit 4의 One major advantage is… 뒤에 장점을 넣어요." },
      { en: "On the downside, deadlines can be stressful.", ko: "반면 아쉬운 점은 마감 기한이 스트레스가 될 수 있다는 거예요.", note: "On the downside는 단점이나 아쉬운 점을 덧붙이는 연결 표현이에요." },
      { en: "The most rewarding part is helping people.", ko: "가장 보람 있는 부분은 사람들을 돕는 거예요.", note: "rewarding은 보람을 주는, 만족감을 주는이라는 뜻이에요." }
    ],
    dialogue: [
      { speaker: "A", en: "What do you enjoy most about your job?", ko: "일하면서 가장 좋아하는 점은 무엇인가요?" },
      { speaker: "B", en: "One major advantage is the flexibility.", ko: "큰 장점 중 하나는 유연성이에요." },
      { speaker: "A", en: "What is one challenge you would like to change?", ko: "바꾸고 싶은 어려움이 하나 있다면 무엇인가요?" },
      { speaker: "B", en: "On the downside, deadlines can be stressful. But the most rewarding part is helping people.", ko: "아쉬운 점은 마감 기한이 스트레스가 될 수 있다는 거예요. 그래도 가장 보람 있는 부분은 사람들을 돕는 거예요." }
    ],
    prompt: "내 일의 장점 하나와 어려움 하나를 말하고, 가장 보람 있었던 순간을 덧붙여 보세요.",
    example: "One major advantage is working with a great team. On the downside, deadlines can be stressful. The most rewarding part is solving a problem together.",
    quiz: [
      { q: "단점이나 아쉬운 점을 덧붙일 때 쓰는 표현은?", options: ["On the downside,", "For example,", "Nice to meet you."], answer: 0, explanation: "On the downside는 앞서 말한 좋은 점과 함께 아쉬운 면을 설명할 때 유용해요." },
      { q: "‘rewarding’에 가장 가까운 뜻은?", options: ["급한", "보람 있는", "반복되는"], answer: 1, explanation: "일이나 경험이 만족감과 보람을 준다는 뜻이에요." },
      { q: "‘One major advantage is…’ 뒤에 어울리는 내용은?", options: ["the stressful deadlines", "the long commute", "the flexibility"], answer: 2, explanation: "advantage는 장점이에요. 이 보기에서는 유연성이 장점에 해당해요." }
    ]
  },
  {
    id: 5, title: "업무에서 쓰는 영어", subtitle: "내 일에 영어가 필요한 순간을 떠올려요", icon: "🌐",
    phrases: [
      { en: "English plays a key role in communicating with overseas partners.", ko: "영어는 해외 파트너와 소통하는 데 핵심적인 역할을 해요.", note: "PDF Toolkit 5. play a key role in은 ‘~에서 핵심적인 역할을 하다’예요." },
      { en: "I occasionally need to present ideas in English.", ko: "가끔 영어로 아이디어를 발표해야 해요.", note: "occasionally는 가끔이라는 뜻이에요. need to 뒤에 필요한 활동을 넣어요." },
      { en: "It would help me communicate more effectively with clients.", ko: "그것은 고객과 더 효과적으로 소통하는 데 도움이 될 거예요.", note: "여기서 It은 영어 실력 향상이에요. help me + 동사원형 패턴을 써요." }
    ],
    dialogue: [
      { speaker: "A", en: "When do you need English in your job?", ko: "업무에서 언제 영어가 필요한가요?" },
      { speaker: "B", en: "English plays a key role in communicating with overseas partners.", ko: "영어는 해외 파트너와 소통하는 데 핵심적인 역할을 해요." },
      { speaker: "A", en: "What English-speaking situation is most challenging?", ko: "영어로 말해야 하는 상황 중 무엇이 가장 어려운가요?" },
      { speaker: "B", en: "I occasionally need to present ideas in English. Better English would help me communicate more effectively with clients.", ko: "가끔 영어로 아이디어를 발표해야 해요. 영어 실력이 좋아지면 고객과 더 효과적으로 소통할 수 있을 거예요." }
    ],
    prompt: "회의, 이메일, 고객 응대, 발표 중 내게 필요한 상황을 골라 말해 보세요. 영어를 아직 쓰지 않는다면 앞으로 써보고 싶은 상황으로 연습해요.",
    example: "I occasionally need to join online meetings in English. Better English would help me communicate more effectively with colleagues.",
    quiz: [
      { q: "‘occasionally’의 뜻은?", options: ["언제나", "절대로", "가끔"], answer: 2, explanation: "occasionally는 가끔, 때때로라는 뜻이에요." },
      { q: "‘핵심적인 역할을 하다’는?", options: ["play a key role", "keep a key", "take a role away"], answer: 0, explanation: "play a key role in…으로 어떤 일에서 중요한 역할을 한다고 말해요." },
      { q: "‘more effectively’에 맞는 뜻은?", options: ["더 천천히", "더 효과적으로", "더 자주"], answer: 1, explanation: "effectively는 효과적으로라는 뜻이에요. 소통의 질이 좋아진다는 의미예요." }
    ]
  },
  {
    id: 6, title: "협업 표현 미션", subtitle: "사진 속 업무 관용구를 대화에 써봐요", icon: "🤝",
    phrases: [
      { en: "Please keep me in the loop.", ko: "진행 상황을 저에게도 계속 공유해 주세요.", note: "이미지의 keep someone in the loop. 필요한 정보를 계속 공유해 달라는 뜻이에요." },
      { en: "Let's make sure we're on the same page.", ko: "우리 모두 같은 내용을 이해하고 있는지 확인해 봅시다.", note: "be on the same page는 생각이나 이해가 일치한다는 뜻이에요." },
      { en: "I'll follow up on the proposal tomorrow.", ko: "내일 그 제안 건의 진행 상황을 확인하겠습니다.", note: "follow up on은 앞서 논의한 일의 진행 상황을 확인하거나 후속 조치를 하는 거예요." }
    ],
    dialogue: [
      { speaker: "A", en: "Let's get the ball rolling. Are we on the same page about the deadline?", ko: "시작해 봅시다. 마감 기한에 대해 같은 내용을 이해하고 있나요?" },
      { speaker: "B", en: "Yes. I'm tied up this morning, but I'll follow up on the proposal tomorrow.", ko: "네. 오늘 오전은 일이 있어 바쁘지만, 내일 제안 건의 진행 상황을 확인할게요." },
      { speaker: "A", en: "Thanks. Please keep me in the loop.", ko: "고마워요. 진행 상황을 저에게도 계속 공유해 주세요." },
      { speaker: "B", en: "Of course. I'll take your feedback into account.", ko: "물론이죠. 의견을 고려하겠습니다." }
    ],
    prompt: "동료와 프로젝트 진행 상황을 나누는 상황이에요. 정보 공유 요청, 같은 이해인지 확인, 후속 조치 약속 중 두 가지를 골라 말해 보세요.",
    example: "Let's make sure we're on the same page. I'll follow up on the proposal tomorrow. Please keep me in the loop.",
    quiz: [
      { q: "‘Please keep me in the loop.’의 뜻은?", options: ["저를 기다려 주세요.", "진행 상황을 저에게도 공유해 주세요.", "회의를 끝내 주세요."], answer: 1, explanation: "keep someone in the loop는 그 사람에게 관련 소식을 계속 알려 주는 거예요." },
      { q: "‘We're on the same page.’가 말하는 상태는?", options: ["같은 책을 읽고 있어요.", "일이 너무 많아요.", "같은 내용을 이해하고 있어요."], answer: 2, explanation: "업무 대화에서는 서로 이해나 생각이 일치한다는 뜻으로 써요." },
      { q: "제안 건의 진행 상황을 다시 확인하겠다고 말하려면?", options: ["I'll follow up on the proposal.", "I'll lash out at the proposal.", "I'll give up the proposal."], answer: 0, explanation: "follow up on은 이미 시작한 일이나 앞서 논의한 일에 대해 확인·후속 조치를 한다는 뜻이에요." }
    ]
  },
  {
    id: 7, title: "주간 대화 챌린지", subtitle: "질문을 더하고 다음 3개월의 목표를 정해요", icon: "🏆",
    phrases: [
      { en: "Could you tell us more about that?", ko: "그 점에 대해 조금 더 이야기해 주시겠어요?", note: "PDF 후속질문 모음. 상대방의 답에서 궁금한 부분을 더 물어봐요." },
      { en: "Can you give us an example?", ko: "예를 하나 들어 주시겠어요?", note: "구체적인 사례를 부탁하면 대화를 더 깊게 이어갈 수 있어요." },
      { en: "How did you handle that situation?", ko: "그 상황에 어떻게 대처하셨나요?", note: "handle a situation은 상황에 대처하다는 뜻이에요." }
    ],
    dialogue: [
      { speaker: "A", en: "My biggest challenge is speaking in meetings.", ko: "가장 큰 어려움은 회의에서 말하는 거예요." },
      { speaker: "B", en: "Could you tell us more about that? Can you give us an example?", ko: "그 점에 대해 조금 더 이야기해 주시겠어요? 예를 하나 들어 주시겠어요?" },
      { speaker: "A", en: "Last week, I needed more time to explain an idea.", ko: "지난주에 아이디어를 설명하는 데 시간이 더 필요했어요." },
      { speaker: "B", en: "How did you handle that situation?", ko: "그 상황에 어떻게 대처하셨나요?" }
    ],
    prompt: "수강 이유 → 내 일 → 일의 장단점 → 업무에서의 영어를 1분 동안 연결해 말해 보세요. 상대 역할로 후속질문 하나도 해보세요. 마지막에 앞으로 3개월의 목표와 매주 할 행동 하나를 정해요.",
    example: "I signed up because I want to speak with more confidence. I work in marketing. One major advantage is the flexibility. I occasionally need to present ideas in English. In the next three months, I want to give a one-minute introduction without notes. I'll practice for twenty minutes every day.",
    quiz: [
      { q: "상대방에게 구체적인 사례를 부탁할 때는?", options: ["Can you give us an example?", "What do you do for a living?", "Are you tied up?"], answer: 0, explanation: "example은 예시예요. 상대방의 이야기를 구체적으로 듣고 싶을 때 써요." },
      { q: "‘How did you handle that situation?’의 뜻은?", options: ["그 상황을 언제 보셨나요?", "그 상황에 어떻게 대처하셨나요?", "그 일을 누구에게 맡겼나요?"], answer: 1, explanation: "handle은 이 문장에서 대처하다, 처리하다는 뜻이에요." },
      { q: "다음 3개월의 목표로 가장 구체적인 것은?", options: ["영어를 잘하고 싶어요.", "언젠가 더 공부할 거예요.", "메모 없이 영어로 1분간 내 일을 소개할 거예요."], answer: 2, explanation: "직접 해보며 달성 여부를 확인할 수 있는 행동으로 목표를 정해 보세요." }
    ]
  }
];

const BUSINESS_DATA = [
  { en: "What made you decide to join this class?", ko: "어떤 계기로 이 수업에 참여하게 됐나요?", note: "PDF · 수강 동기 토론 질문", cat: "비즈니스 영어", kind: "표현" },
  { en: "What do you hope to get out of it?", ko: "이 수업에서 무엇을 얻고 싶으세요?", note: "get something out of는 어떤 경험에서 도움이나 성과를 얻는다는 뜻이에요.", cat: "비즈니스 영어", kind: "표현" },
  { en: "What has stopped you from studying English before?", ko: "그동안 영어 공부를 어렵게 만든 것은 무엇이었나요?", note: "stop someone from -ing는 누군가가 ~하지 못하게 하다라는 뜻이에요.", cat: "비즈니스 영어", kind: "표현" },
  { en: "I signed up because…", ko: "…해서 신청했어요.", note: "PDF · Toolkit 1. because 뒤에 신청한 이유를 넣어요.", cat: "비즈니스 영어", kind: "표현" },
  { en: "I'd like to build my confidence in…", ko: "…에 자신감을 키우고 싶어요.", note: "in 뒤에 명사나 -ing 형태를 넣어요.", cat: "비즈니스 영어", kind: "표현" },
  { en: "My biggest challenge is…", ko: "가장 큰 어려움은 …예요.", note: "PDF · Toolkit 1. finding time to practice처럼 내 어려움을 덧붙여요.", cat: "비즈니스 영어", kind: "표현" },
  { en: "My long-term goal is to…", ko: "제 장기 목표는 …하는 거예요.", note: "PDF · Toolkit 2. to 뒤에는 동사원형을 넣어요.", cat: "비즈니스 영어", kind: "표현" },
  { en: "It would open up opportunities to…", ko: "그것은 …할 기회를 열어 줄 거예요.", note: "영어 실력 향상으로 생길 기회를 이야기해요.", cat: "비즈니스 영어", kind: "표현" },
  { en: "I want to become more fluent in English.", ko: "영어를 더 유창하게 하고 싶어요.", note: "PDF · Toolkit 2의 패턴을 완성한 연습 문장. fluent in + 언어", cat: "비즈니스 영어", kind: "표현" },
  { en: "What do you do for a living?", ko: "어떤 일을 하시나요?", note: "PDF · 직업과 담당업무 토론 질문", cat: "비즈니스 영어", kind: "표현" },
  { en: "What does a typical workday look like?", ko: "보통 하루 업무는 어떻게 되나요?", note: "typical은 전형적인, 보통의라는 뜻이에요.", cat: "비즈니스 영어", kind: "표현" },
  { en: "I work as a…", ko: "저는 …로 일해요.", note: "PDF · Toolkit 3. a developer처럼 직업을 넣어요.", cat: "비즈니스 영어", kind: "표현" },
  { en: "I work in…", ko: "저는 … 분야에서 일해요.", note: "marketing, education처럼 분야를 넣어요.", cat: "비즈니스 영어", kind: "표현" },
  { en: "I'm responsible for…", ko: "저는 …을 담당해요.", note: "PDF · Toolkit 3. for 뒤에 명사나 -ing 형태를 넣어요.", cat: "비즈니스 영어", kind: "표현" },
  { en: "My role involves…", ko: "제 역할에는 …이 포함돼요.", note: "involves 뒤에 명사나 -ing 형태를 넣어요.", cat: "비즈니스 영어", kind: "표현" },
  { en: "One major advantage is…", ko: "큰 장점 중 하나는 …예요.", note: "PDF · Toolkit 4. flexibility처럼 장점을 넣어요.", cat: "비즈니스 영어", kind: "표현" },
  { en: "On the downside,…", ko: "반면 아쉬운 점은 …예요.", note: "직업이나 상황의 단점을 덧붙일 때 써요.", cat: "비즈니스 영어", kind: "표현" },
  { en: "The most rewarding part is…", ko: "가장 보람 있는 부분은 …예요.", note: "PDF · Toolkit 4. helping people처럼 보람 있는 활동을 넣어요.", cat: "비즈니스 영어", kind: "표현" },
  { en: "English plays a key role in…", ko: "영어는 …에서 핵심적인 역할을 해요.", note: "PDF · Toolkit 5. in 뒤에 명사나 -ing 형태를 넣어요.", cat: "비즈니스 영어", kind: "표현" },
  { en: "I occasionally need to…", ko: "저는 가끔 …해야 해요.", note: "PDF · Toolkit 5. to 뒤에는 동사원형을 넣어요.", cat: "비즈니스 영어", kind: "표현" },
  { en: "It would help me communicate more effectively with…", ko: "그것은 …와 더 효과적으로 소통하는 데 도움이 될 거예요.", note: "영어 실력 향상이 주는 도움을 설명하는 패턴이에요.", cat: "비즈니스 영어", kind: "표현" },
  { en: "Could you tell us more about that?", ko: "그 점에 대해 조금 더 이야기해 주시겠어요?", note: "PDF · 후속질문 모음. 상대방의 답에 관심을 보이며 더 물어봐요.", cat: "비즈니스 영어", kind: "표현" },
  { en: "Can you give us an example?", ko: "예를 하나 들어 주시겠어요?", note: "구체적인 사례를 부탁하는 질문이에요.", cat: "비즈니스 영어", kind: "표현" },
  { en: "What makes you say that?", ko: "어떤 이유로 그렇게 말씀하시나요?", note: "PDF · 후속질문 모음. 말투에 따라 따지는 느낌도 날 수 있으니 차분하게 물어요.", cat: "비즈니스 영어", kind: "표현" },
  { en: "How did you handle that situation?", ko: "그 상황에 어떻게 대처하셨나요?", note: "handle a situation은 상황에 대처하다라는 뜻이에요.", cat: "비즈니스 영어", kind: "표현" },
  { en: "Has your opinion changed over time?", ko: "시간이 지나면서 생각이 달라졌나요?", note: "PDF · 후속질문 모음. over time은 시간이 흐르면서라는 뜻이에요.", cat: "비즈니스 영어", kind: "표현" },
  { en: "In the next three months, I want to be able to…", ko: "앞으로 3개월 안에 …할 수 있게 되고 싶어요.", note: "PDF의 By February 목표를 언제든 쓸 수 있는 3개월 목표로 바꾼 학습용 패턴이에요.", cat: "비즈니스 영어", kind: "표현" },
  { en: "keep someone in the loop", ko: "누군가에게 관련 소식·진행 상황을 계속 공유하다", note: "업로드 이미지 · Please keep me in the loop. 진행 상황을 저에게도 공유해 주세요.", cat: "비즈니스 영어", kind: "표현" },
  { en: "be on the same page", ko: "서로 같은 내용을 이해하다; 생각이 일치하다", note: "업로드 이미지 · Let's make sure we're on the same page.", cat: "비즈니스 영어", kind: "표현" },
  { en: "follow up on", ko: "진행 상황을 확인하다; 후속 조치를 하다", note: "업로드 이미지 · I'll follow up on the proposal tomorrow.", cat: "비즈니스 영어", kind: "표현" },
  { en: "take into account", ko: "고려하다; 감안하다", note: "업로드 이미지 · take your feedback into account처럼 고려할 대상을 가운데 넣을 수 있어요.", cat: "비즈니스 영어", kind: "표현" },
  { en: "be tied up", ko: "다른 일로 바쁘다; 시간을 내기 어렵다", note: "업로드 이미지 · I'm tied up this morning. 오늘 오전에는 일이 있어 바빠요.", cat: "비즈니스 영어", kind: "표현" },
  { en: "get the ball rolling", ko: "일을 시작하다; 일을 진행시키기 시작하다", note: "업로드 이미지 · Let's get the ball rolling. 시작해 봅시다.", cat: "비즈니스 영어", kind: "표현" },
  { en: "find middle ground", ko: "절충점·타협점을 찾다", note: "업로드 이미지 · Let's find middle ground on the schedule. 일정에서 절충점을 찾아봅시다.", cat: "비즈니스 영어", kind: "표현" },
  { en: "go the extra mile", ko: "기대 이상으로 더 노력하다", note: "업로드 이미지 · She goes the extra mile for her clients. 그녀는 고객을 위해 한층 더 노력해요.", cat: "비즈니스 영어", kind: "표현" },
  { en: "have a lot on one's plate", ko: "해야 할 일이 많다", note: "업로드 이미지 · I have a lot on my plate this week. 이번 주는 할 일이 많아요.", cat: "비즈니스 영어", kind: "표현" },
  { en: "ripple through", ko: "여파·영향이 …에 퍼지다", note: "업로드 이미지 · The effects rippled through the industry. 그 영향이 업계 전반으로 퍼졌어요.", cat: "비즈니스 영어", kind: "표현" },
  { en: "lash out", ko: "화를 내며 공격하다; 거칠게 비난하다", note: "업로드 이미지 · lash out at someone처럼 대상을 at 뒤에 넣어요. 중립적인 업무 요청 표현과 구별해요.", cat: "비즈니스 영어", kind: "표현" },
  { en: "double down", ko: "기존 입장·노력을 더욱 강화하다", note: "업로드 이미지 · double down on an investment처럼 on 뒤에 강화할 대상을 넣어요.", cat: "비즈니스 영어", kind: "표현" },
  { en: "confidence", ko: "자신감", note: "PDF · build confidence: 자신감을 키우다", cat: "비즈니스 영어", kind: "단어" },
  { en: "motivation", ko: "동기; 의욕", note: "PDF · motivation for learning English: 영어 학습 동기", cat: "비즈니스 영어", kind: "단어" },
  { en: "opportunity", ko: "기회", note: "PDF · 복수형은 opportunities예요.", cat: "비즈니스 영어", kind: "단어" },
  { en: "priority", ko: "우선순위; 우선하는 일", note: "PDF 모델 답변 · Speaking fluently is a priority.", cat: "비즈니스 영어", kind: "단어" },
  { en: "responsibility", ko: "책임; 담당업무", note: "PDF · main responsibility: 주된 담당업무", cat: "비즈니스 영어", kind: "단어" },
  { en: "campaign", ko: "캠페인; 홍보 활동", note: "PDF · planning campaigns: 캠페인 기획", cat: "비즈니스 영어", kind: "단어" },
  { en: "analyze", ko: "분석하다", note: "PDF · analyzing customer data: 고객 데이터 분석", cat: "비즈니스 영어", kind: "단어" },
  { en: "flexibility", ko: "유연성", note: "PDF · 근무 방식이나 일정의 유연성을 설명할 때 쓸 수 있어요.", cat: "비즈니스 영어", kind: "단어" },
  { en: "deadline", ko: "마감 기한", note: "PDF · Deadlines can be stressful. 마감 기한이 스트레스가 될 수 있어요.", cat: "비즈니스 영어", kind: "단어" },
  { en: "rewarding", ko: "보람 있는; 만족감을 주는", note: "PDF · the most rewarding part: 가장 보람 있는 부분", cat: "비즈니스 영어", kind: "단어" },
  { en: "occasionally", ko: "가끔; 때때로", note: "PDF · 일의 빈도를 설명할 때 쓰는 부사예요.", cat: "비즈니스 영어", kind: "단어" },
  { en: "overseas", ko: "해외의; 해외에", note: "PDF · overseas partners: 해외 파트너", cat: "비즈니스 영어", kind: "단어" },
  { en: "commitment", ko: "다짐; 약속", note: "PDF 마지막 활동 · 실천할 행동을 구체적으로 정해요.", cat: "비즈니스 영어", kind: "단어" },
  { en: "breakneck", ko: "매우 빠른; 아찔할 만큼 빠른", note: "업로드 이미지 · at breakneck speed: 엄청난 속도로", cat: "비즈니스 영어", kind: "단어" },
  { en: "liabilities", ko: "부채; 법적 책임", note: "업로드 이미지 · 재무 문맥에서는 부채, 법률 문맥에서는 책임을 뜻할 수 있어요.", cat: "비즈니스 영어", kind: "단어" },
  { en: "involution", ko: "소모적인 내부 경쟁; 경쟁의 과열", note: "업로드 이미지의 사회·경제 문맥에 맞춘 뜻이에요. 학문 분야에 따라 다른 뜻으로도 쓰여요.", cat: "비즈니스 영어", kind: "단어" },
  { en: "higher-end", ko: "더 고급인; 상위급의", note: "업로드 이미지 · higher-end products: 더 고급인 제품들", cat: "비즈니스 영어", kind: "단어" },
  { en: "unfolding", ko: "전개되는; 펼쳐지는", note: "업로드 이미지 · an unfolding situation: 전개되고 있는 상황. unfold의 -ing 형태예요.", cat: "비즈니스 영어", kind: "단어" },
  { en: "rubber-stamp parliament", ko: "결정을 형식적으로 추인하는 의회", note: "업로드 이미지 · 실질적인 심의 없이 결정을 승인한다는 비판적인 표현이에요.", cat: "비즈니스 영어", kind: "표현" },
  { en: "funneling information", ko: "정보를 한곳으로 모으거나 특정 경로로 전달하는 것", note: "업로드 이미지 · funnel information의 -ing 형태. funneling information to a team처럼 전달 대상을 덧붙일 수 있어요.", cat: "비즈니스 영어", kind: "표현" }
];

const FRUIT_DATA=[{"en": "orange", "ko": "오렌지", "fruit": "orange", "cat": "과일", "kind": "단어", "note": "영어 단어가 정확히 인식되면 같은 과일이 움직여요."}, {"en": "apple", "ko": "사과", "fruit": "apple", "cat": "과일", "kind": "단어", "note": "영어 단어가 정확히 인식되면 같은 과일이 움직여요."}, {"en": "banana", "ko": "바나나", "fruit": "banana", "cat": "과일", "kind": "단어", "note": "영어 단어가 정확히 인식되면 같은 과일이 움직여요."}, {"en": "grape", "ko": "포도", "fruit": "grape", "cat": "과일", "kind": "단어", "note": "영어 단어가 정확히 인식되면 같은 과일이 움직여요."}, {"en": "strawberry", "ko": "딸기", "fruit": "strawberry", "cat": "과일", "kind": "단어", "note": "영어 단어가 정확히 인식되면 같은 과일이 움직여요."}, {"en": "watermelon", "ko": "수박", "fruit": "watermelon", "cat": "과일", "kind": "단어", "note": "영어 단어가 정확히 인식되면 같은 과일이 움직여요."}];
const FRUIT_DAYS=[{"id": 1, "title": "첫 과일 배송", "subtitle": "듣고 말해서 오렌지, 사과, 바나나를 보내요", "icon": "🍊", "phrases": [{"en": "orange", "ko": "오렌지", "fruit": "orange", "cat": "과일", "kind": "단어", "note": "영어 단어가 정확히 인식되면 같은 과일이 움직여요."}, {"en": "apple", "ko": "사과", "fruit": "apple", "cat": "과일", "kind": "단어", "note": "영어 단어가 정확히 인식되면 같은 과일이 움직여요."}, {"en": "banana", "ko": "바나나", "fruit": "banana", "cat": "과일", "kind": "단어", "note": "영어 단어가 정확히 인식되면 같은 과일이 움직여요."}], "dialogue": [{"speaker": "A", "en": "What fruit would you like?", "ko": "어떤 과일을 드릴까요?"}, {"speaker": "B", "en": "An apple, please.", "ko": "사과 주세요."}, {"speaker": "A", "en": "Would you like an orange, too?", "ko": "오렌지도 드릴까요?"}, {"speaker": "B", "en": "Yes, please. Thank you!", "ko": "네, 주세요. 고마워요!"}], "prompt": "가장 좋아하는 과일을 고르고 I like…로 말해 보세요. 과일 이름을 바꿔 세 번 도전해요.", "example": "I like apples. I like oranges, too.", "quiz": [{"q": "오렌지를 영어로 말하면?", "options": ["apple", "orange", "banana"], "answer": 1, "explanation": "오렌지는 orange예요. 소리를 듣고 한 번 더 말해 보세요."}, {"q": "사과를 영어로 말하면?", "options": ["banana", "apple", "grape"], "answer": 1, "explanation": "사과는 apple예요. 소리를 듣고 한 번 더 말해 보세요."}, {"q": "바나나를 영어로 말하면?", "options": ["grape", "banana", "strawberry"], "answer": 1, "explanation": "바나나는 banana예요. 소리를 듣고 한 번 더 말해 보세요."}]}, {"id": 2, "title": "알록달록 과일 창고", "subtitle": "듣고 말해서 포도, 딸기, 수박를 보내요", "icon": "🍇", "phrases": [{"en": "grape", "ko": "포도", "fruit": "grape", "cat": "과일", "kind": "단어", "note": "영어 단어가 정확히 인식되면 같은 과일이 움직여요."}, {"en": "strawberry", "ko": "딸기", "fruit": "strawberry", "cat": "과일", "kind": "단어", "note": "영어 단어가 정확히 인식되면 같은 과일이 움직여요."}, {"en": "watermelon", "ko": "수박", "fruit": "watermelon", "cat": "과일", "kind": "단어", "note": "영어 단어가 정확히 인식되면 같은 과일이 움직여요."}], "dialogue": [{"speaker": "A", "en": "What fruit would you like?", "ko": "어떤 과일을 드릴까요?"}, {"speaker": "B", "en": "An apple, please.", "ko": "사과 주세요."}, {"speaker": "A", "en": "Would you like an orange, too?", "ko": "오렌지도 드릴까요?"}, {"speaker": "B", "en": "Yes, please. Thank you!", "ko": "네, 주세요. 고마워요!"}], "prompt": "가장 좋아하는 과일을 고르고 I like…로 말해 보세요. 과일 이름을 바꿔 세 번 도전해요.", "example": "I like apples. I like oranges, too.", "quiz": [{"q": "포도를 영어로 말하면?", "options": ["strawberry", "grape", "watermelon"], "answer": 1, "explanation": "포도는 grape예요. 소리를 듣고 한 번 더 말해 보세요."}, {"q": "딸기를 영어로 말하면?", "options": ["watermelon", "strawberry", "orange"], "answer": 1, "explanation": "딸기는 strawberry예요. 소리를 듣고 한 번 더 말해 보세요."}, {"q": "수박를 영어로 말하면?", "options": ["orange", "watermelon", "apple"], "answer": 1, "explanation": "수박는 watermelon예요. 소리를 듣고 한 번 더 말해 보세요."}]}, {"id": 3, "title": "오렌지의 새 친구", "subtitle": "듣고 말해서 오렌지, 바나나, 딸기를 보내요", "icon": "🍓", "phrases": [{"en": "orange", "ko": "오렌지", "fruit": "orange", "cat": "과일", "kind": "단어", "note": "영어 단어가 정확히 인식되면 같은 과일이 움직여요."}, {"en": "banana", "ko": "바나나", "fruit": "banana", "cat": "과일", "kind": "단어", "note": "영어 단어가 정확히 인식되면 같은 과일이 움직여요."}, {"en": "strawberry", "ko": "딸기", "fruit": "strawberry", "cat": "과일", "kind": "단어", "note": "영어 단어가 정확히 인식되면 같은 과일이 움직여요."}], "dialogue": [{"speaker": "A", "en": "What fruit would you like?", "ko": "어떤 과일을 드릴까요?"}, {"speaker": "B", "en": "An apple, please.", "ko": "사과 주세요."}, {"speaker": "A", "en": "Would you like an orange, too?", "ko": "오렌지도 드릴까요?"}, {"speaker": "B", "en": "Yes, please. Thank you!", "ko": "네, 주세요. 고마워요!"}], "prompt": "가장 좋아하는 과일을 고르고 I like…로 말해 보세요. 과일 이름을 바꿔 세 번 도전해요.", "example": "I like apples. I like oranges, too.", "quiz": [{"q": "오렌지를 영어로 말하면?", "options": ["apple", "orange", "banana"], "answer": 1, "explanation": "오렌지는 orange예요. 소리를 듣고 한 번 더 말해 보세요."}, {"q": "바나나를 영어로 말하면?", "options": ["grape", "banana", "strawberry"], "answer": 1, "explanation": "바나나는 banana예요. 소리를 듣고 한 번 더 말해 보세요."}, {"q": "딸기를 영어로 말하면?", "options": ["watermelon", "strawberry", "orange"], "answer": 1, "explanation": "딸기는 strawberry예요. 소리를 듣고 한 번 더 말해 보세요."}]}, {"id": 4, "title": "사과와 친구들의 모험", "subtitle": "듣고 말해서 사과, 포도, 수박를 보내요", "icon": "🍎", "phrases": [{"en": "apple", "ko": "사과", "fruit": "apple", "cat": "과일", "kind": "단어", "note": "영어 단어가 정확히 인식되면 같은 과일이 움직여요."}, {"en": "grape", "ko": "포도", "fruit": "grape", "cat": "과일", "kind": "단어", "note": "영어 단어가 정확히 인식되면 같은 과일이 움직여요."}, {"en": "watermelon", "ko": "수박", "fruit": "watermelon", "cat": "과일", "kind": "단어", "note": "영어 단어가 정확히 인식되면 같은 과일이 움직여요."}], "dialogue": [{"speaker": "A", "en": "What fruit would you like?", "ko": "어떤 과일을 드릴까요?"}, {"speaker": "B", "en": "An apple, please.", "ko": "사과 주세요."}, {"speaker": "A", "en": "Would you like an orange, too?", "ko": "오렌지도 드릴까요?"}, {"speaker": "B", "en": "Yes, please. Thank you!", "ko": "네, 주세요. 고마워요!"}], "prompt": "가장 좋아하는 과일을 고르고 I like…로 말해 보세요. 과일 이름을 바꿔 세 번 도전해요.", "example": "I like apples. I like oranges, too.", "quiz": [{"q": "사과를 영어로 말하면?", "options": ["banana", "apple", "grape"], "answer": 1, "explanation": "사과는 apple예요. 소리를 듣고 한 번 더 말해 보세요."}, {"q": "포도를 영어로 말하면?", "options": ["strawberry", "grape", "watermelon"], "answer": 1, "explanation": "포도는 grape예요. 소리를 듣고 한 번 더 말해 보세요."}, {"q": "수박를 영어로 말하면?", "options": ["orange", "watermelon", "apple"], "answer": 1, "explanation": "수박는 watermelon예요. 소리를 듣고 한 번 더 말해 보세요."}]}, {"id": 5, "title": "세 가지 과일 미션", "subtitle": "듣고 말해서 바나나, 딸기, 오렌지를 보내요", "icon": "🍌", "phrases": [{"en": "banana", "ko": "바나나", "fruit": "banana", "cat": "과일", "kind": "단어", "note": "영어 단어가 정확히 인식되면 같은 과일이 움직여요."}, {"en": "strawberry", "ko": "딸기", "fruit": "strawberry", "cat": "과일", "kind": "단어", "note": "영어 단어가 정확히 인식되면 같은 과일이 움직여요."}, {"en": "orange", "ko": "오렌지", "fruit": "orange", "cat": "과일", "kind": "단어", "note": "영어 단어가 정확히 인식되면 같은 과일이 움직여요."}], "dialogue": [{"speaker": "A", "en": "What fruit would you like?", "ko": "어떤 과일을 드릴까요?"}, {"speaker": "B", "en": "An apple, please.", "ko": "사과 주세요."}, {"speaker": "A", "en": "Would you like an orange, too?", "ko": "오렌지도 드릴까요?"}, {"speaker": "B", "en": "Yes, please. Thank you!", "ko": "네, 주세요. 고마워요!"}], "prompt": "가장 좋아하는 과일을 고르고 I like…로 말해 보세요. 과일 이름을 바꿔 세 번 도전해요.", "example": "I like apples. I like oranges, too.", "quiz": [{"q": "바나나를 영어로 말하면?", "options": ["grape", "banana", "strawberry"], "answer": 1, "explanation": "바나나는 banana예요. 소리를 듣고 한 번 더 말해 보세요."}, {"q": "딸기를 영어로 말하면?", "options": ["watermelon", "strawberry", "orange"], "answer": 1, "explanation": "딸기는 strawberry예요. 소리를 듣고 한 번 더 말해 보세요."}, {"q": "오렌지를 영어로 말하면?", "options": ["apple", "orange", "banana"], "answer": 1, "explanation": "오렌지는 orange예요. 소리를 듣고 한 번 더 말해 보세요."}]}, {"id": 6, "title": "나만의 과일 가게", "subtitle": "듣고 말해서 수박, 사과, 포도를 보내요", "icon": "🍉", "phrases": [{"en": "watermelon", "ko": "수박", "fruit": "watermelon", "cat": "과일", "kind": "단어", "note": "영어 단어가 정확히 인식되면 같은 과일이 움직여요."}, {"en": "apple", "ko": "사과", "fruit": "apple", "cat": "과일", "kind": "단어", "note": "영어 단어가 정확히 인식되면 같은 과일이 움직여요."}, {"en": "grape", "ko": "포도", "fruit": "grape", "cat": "과일", "kind": "단어", "note": "영어 단어가 정확히 인식되면 같은 과일이 움직여요."}], "dialogue": [{"speaker": "A", "en": "What fruit would you like?", "ko": "어떤 과일을 드릴까요?"}, {"speaker": "B", "en": "An apple, please.", "ko": "사과 주세요."}, {"speaker": "A", "en": "Would you like an orange, too?", "ko": "오렌지도 드릴까요?"}, {"speaker": "B", "en": "Yes, please. Thank you!", "ko": "네, 주세요. 고마워요!"}], "prompt": "가장 좋아하는 과일을 고르고 I like…로 말해 보세요. 과일 이름을 바꿔 세 번 도전해요.", "example": "I like apples. I like oranges, too.", "quiz": [{"q": "수박를 영어로 말하면?", "options": ["orange", "watermelon", "apple"], "answer": 1, "explanation": "수박는 watermelon예요. 소리를 듣고 한 번 더 말해 보세요."}, {"q": "사과를 영어로 말하면?", "options": ["banana", "apple", "grape"], "answer": 1, "explanation": "사과는 apple예요. 소리를 듣고 한 번 더 말해 보세요."}, {"q": "포도를 영어로 말하면?", "options": ["strawberry", "grape", "watermelon"], "answer": 1, "explanation": "포도는 grape예요. 소리를 듣고 한 번 더 말해 보세요."}]}, {"id": 7, "title": "이번 주 배송왕", "subtitle": "듣고 말해서 딸기, 오렌지, 수박를 보내요", "icon": "🏆", "phrases": [{"en": "strawberry", "ko": "딸기", "fruit": "strawberry", "cat": "과일", "kind": "단어", "note": "영어 단어가 정확히 인식되면 같은 과일이 움직여요."}, {"en": "orange", "ko": "오렌지", "fruit": "orange", "cat": "과일", "kind": "단어", "note": "영어 단어가 정확히 인식되면 같은 과일이 움직여요."}, {"en": "watermelon", "ko": "수박", "fruit": "watermelon", "cat": "과일", "kind": "단어", "note": "영어 단어가 정확히 인식되면 같은 과일이 움직여요."}], "dialogue": [{"speaker": "A", "en": "What fruit would you like?", "ko": "어떤 과일을 드릴까요?"}, {"speaker": "B", "en": "An apple, please.", "ko": "사과 주세요."}, {"speaker": "A", "en": "Would you like an orange, too?", "ko": "오렌지도 드릴까요?"}, {"speaker": "B", "en": "Yes, please. Thank you!", "ko": "네, 주세요. 고마워요!"}], "prompt": "가장 좋아하는 과일을 고르고 I like…로 말해 보세요. 과일 이름을 바꿔 세 번 도전해요.", "example": "I like apples. I like oranges, too.", "quiz": [{"q": "딸기를 영어로 말하면?", "options": ["watermelon", "strawberry", "orange"], "answer": 1, "explanation": "딸기는 strawberry예요. 소리를 듣고 한 번 더 말해 보세요."}, {"q": "오렌지를 영어로 말하면?", "options": ["apple", "orange", "banana"], "answer": 1, "explanation": "오렌지는 orange예요. 소리를 듣고 한 번 더 말해 보세요."}, {"q": "수박를 영어로 말하면?", "options": ["orange", "watermelon", "apple"], "answer": 1, "explanation": "수박는 watermelon예요. 소리를 듣고 한 번 더 말해 보세요."}]}];
const COURSE_DATA={fruit:FRUIT_DAYS,business:BUSINESS_DAYS,foundation:DAYS};
const Teaching = (() => {
const SESSION_TTL = 8 * 60 * 60 * 1000;
const LOGIN_WINDOW = 15 * 60 * 1000;
const MAX_PDF = 20 * 1024 * 1024;
const COOKIE = 'teaching_admin';
const DEFAULT_HEADERS = { 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' };
class TeachingError extends Error { constructor(status, code, message) { super(message); this.status = status; this.code = code; } }
const fail = (status, code, message) => { throw new TeachingError(status, code, message); };
const json = (value, status = 200, headers = {}) => new Response(JSON.stringify(value), { status, headers: { ...DEFAULT_HEADERS, 'content-type': 'application/json; charset=utf-8', ...headers } });
const localDate = now => new Date(now + 9 * 3600000).toISOString().slice(0, 10);
const first = (db, sql, ...args) => db.prepare(sql).bind(...args).first();
async function all(db, sql, ...args) { return (await db.prepare(sql).bind(...args).all()).results || []; }
async function hash(value) { const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)); return [...new Uint8Array(bytes)].map(b => b.toString(16).padStart(2, '0')).join(''); }
function sameHash(a, b) { let difference = a.length ^ b.length; for (let i = 0; i < 64; i++) difference |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0); return difference === 0; }
function token() { return [...crypto.getRandomValues(new Uint8Array(32))].map(b => b.toString(16).padStart(2, '0')).join(''); }
function cookieValue(request) { return request.headers.get('cookie')?.split(';').map(part => part.trim()).find(part => part.startsWith(COOKIE + '='))?.slice(COOKIE.length + 1) || ''; }
const setCookie = value => `${COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_TTL / 1000}`;
const clearCookie = () => `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
async function adminSession(request, env, now) { const raw = cookieValue(request); if (!/^[a-f0-9]{64}$/.test(raw) || typeof env.ADMIN_PASSWORD !== 'string' || !env.ADMIN_PASSWORD) return null; const tokenHash = await hash(raw); const session = await first(env.DB, 'SELECT token_hash, secret_hash FROM teacher_admin_sessions WHERE token_hash = ? AND expires_at > ?', tokenHash, now); if (!session || !sameHash(session.secret_hash, await hash(env.ADMIN_PASSWORD))) return null; return { tokenHash }; }
function string(value, max, label, required = false) { if (value === undefined || value === null) value = ''; if (typeof value !== 'string' || value.length > max || (required && !value.trim())) fail(400, 'invalid_input', `${label}을(를) ${required ? '1~' : ''}${max}자 이내로 입력해 주세요.`); return value.trim(); }
function identifier(value, label = '항목') { if (typeof value !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(value)) fail(400, 'invalid_id', `${label}을(를) 다시 선택해 주세요.`); return value; }
function validDate(value) { if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false; const date = new Date(value + 'T00:00:00Z'); return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value; }
function schedule(value) { if (value === undefined || value === null || value === '') return null; if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T/.test(value) || !Number.isFinite(Date.parse(value))) fail(400, 'invalid_schedule', '예약 일시를 다시 선택해 주세요.'); return Date.parse(value); }
function status(value) { if (!['draft', 'published'].includes(value)) fail(400, 'invalid_status', '초안 또는 공개 상태를 선택해 주세요.'); return value; }
function visibleChapter(chapter, now) { return chapter?.status === 'published' && chapter.week_start <= localDate(now) && (chapter.publish_at === null || chapter.publish_at <= now); }
function pdfView(row) { return row?.object_key ? { url: '/api/pdf/' + encodeURIComponent(row.id || row.chapter_id) + '?v=' + encodeURIComponent(row.object_key.split('/').at(-1)), name: row.pdf_name || row.name, size: row.pdf_size ?? row.size, pages: row.pdf_pages ?? row.pages ?? null } : null; }
function chapterView(row) { return { id: row.id, number: row.number, title: row.title, weekStart: row.week_start, body: row.body, status: row.status, publishAt: row.publish_at === null ? null : new Date(row.publish_at).toISOString(), createdAt: row.created_at, updatedAt: row.updated_at, pdf: pdfView(row) }; }
function expressionView(row) { return { id: row.id, chapterId: row.chapter_id, en: row.en, ko: row.ko, note: row.note, kind: row.kind, example: row.example, studyDay: row.study_day, status: row.status, publishAt: row.publish_at === null ? null : new Date(row.publish_at).toISOString(), createdAt: row.created_at, updatedAt: row.updated_at }; }
const CHAPTER_SELECT = 'SELECT c.*, p.object_key, p.name AS pdf_name, p.size AS pdf_size, p.pages AS pdf_pages FROM teacher_chapters c LEFT JOIN teacher_pdfs p ON p.chapter_id = c.id';
async function chapterRow(db, id) { return first(db, CHAPTER_SELECT + ' WHERE c.id = ?', id); }
async function revision(db) { return (await first(db, 'SELECT COALESCE(MAX(id),0) AS revision FROM teacher_revisions')).revision; }
const revisionStatement = (db, kind, now) => db.prepare('INSERT INTO teacher_revisions (kind, created_at) VALUES (?, ?)').bind(kind, now);
async function readLimited(request, max) { const declared = Number(request.headers.get('content-length')); if (declared > max) fail(413, 'body_too_large', '파일 또는 입력 내용이 허용 크기를 넘었어요.'); if (!request.body) return new Uint8Array(); const reader = request.body.getReader(); const chunks = []; let size = 0; try { while (true) { const part = await reader.read(); if (part.done) break; size += part.value.byteLength; if (size > max) { await reader.cancel(); fail(413, 'body_too_large', '파일 또는 입력 내용이 허용 크기를 넘었어요.'); } chunks.push(part.value); } } finally { reader.releaseLock(); } const bytes = new Uint8Array(size); let offset = 0; for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; } return bytes; }
function validatePDFEnvelope(bytes) {
  // Basic truncation protection only; PDF.js performs the full document validation.
  const whitespace = value => value === 0 || value === 9 || value === 10 || value === 12 || value === 13 || value === 32;
  const invalid = () => fail(400, 'invalid_pdf_structure', 'PDF 파일이 완전하지 않아요. 원본 PDF를 다시 선택해 주세요.');
  let end = bytes.length;
  while (end > 0 && whitespace(bytes[end - 1])) end--;
  if (end < 5 || String.fromCharCode(...bytes.subarray(end - 5, end)) !== '%%EOF') invalid();
  const eof = end - 5;
  let numberEnd = eof;
  while (numberEnd > 0 && whitespace(bytes[numberEnd - 1])) numberEnd--;
  let numberStart = numberEnd;
  while (numberStart > 0 && bytes[numberStart - 1] >= 48 && bytes[numberStart - 1] <= 57) numberStart--;
  if (numberStart === numberEnd) invalid();
  const digitStart = numberStart;
  if (numberStart > 0 && bytes[numberStart - 1] === 43) numberStart--;
  let keywordEnd = numberStart;
  while (keywordEnd > 0 && whitespace(bytes[keywordEnd - 1])) keywordEnd--;
  const keywordStart = keywordEnd - 9;
  if (keywordEnd === numberStart || keywordStart < 0 || String.fromCharCode(...bytes.subarray(keywordStart, keywordEnd)) !== 'startxref') invalid();
  let offset = 0;
  for (let index = digitStart; index < numberEnd; index++) {
    offset = offset * 10 + bytes[index] - 48;
    if (!Number.isSafeInteger(offset) || offset >= keywordStart) invalid();
  }
}
async function jsonBody(request) { if (!request.headers.get('content-type')?.includes('application/json')) fail(415, 'json_required', 'JSON 형식으로 요청해 주세요.'); const bytes = await readLimited(request, 512 * 1024); let value; try { value = JSON.parse(new TextDecoder().decode(bytes)); } catch { fail(400, 'invalid_json', '입력 내용을 다시 확인해 주세요.'); } if (!value || typeof value !== 'object' || Array.isArray(value)) fail(400, 'invalid_json', '입력 내용을 다시 확인해 주세요.'); return value; }
function originCheck(request) { const origin = request.headers.get('origin'); if (origin && origin !== new URL(request.url).origin) fail(403, 'invalid_origin', '사이트 안에서 다시 시도해 주세요.'); }
function normalizedStrokes(value) { if (!Array.isArray(value) || value.length > 1000) fail(400, 'invalid_strokes', '필기는 1,000개 선까지 저장할 수 있어요.'); let total = 0; return value.map(stroke => { if (!stroke || !['pen', 'highlighter', 'eraser'].includes(stroke.tool) || typeof stroke.color !== 'string' || !/^#[0-9a-f]{6}$/i.test(stroke.color) || typeof stroke.width !== 'number' || !Number.isFinite(stroke.width) || stroke.width <= 0 || stroke.width > 1 || !Array.isArray(stroke.points) || !stroke.points.length) fail(400, 'invalid_strokes', '필기 형식을 다시 확인해 주세요.'); total += stroke.points.length; if (total > 5000) fail(400, 'invalid_strokes', '한 페이지의 필기가 너무 많아요. 일부 선을 지운 뒤 다시 저장해 주세요.'); const points = stroke.points.map(point => { if (!point || typeof point.x !== 'number' || typeof point.y !== 'number' || !Number.isFinite(point.x) || !Number.isFinite(point.y) || point.x < 0 || point.x > 1 || point.y < 0 || point.y > 1) fail(400, 'invalid_strokes', '필기의 위치를 다시 확인해 주세요.'); return { x: point.x, y: point.y }; }); return { tool: stroke.tool, color: stroke.color.toLowerCase(), width: stroke.width, points }; }); }
function noteView(row, chapterId, page, requiresLogin = false) { let strokes = []; try { strokes = JSON.parse(row?.strokes_json || '[]'); } catch { /* Stored notes remain readable if a historical drawing is malformed. */ } return { chapterId, page, text: row?.text || '', strokes, updatedAt: row?.updated_at || null, requiresLogin }; }
function makeDays(pool, activeChapter, baseDays) { pool = pool.filter(expression => expression.kind === '표현'); if (!pool.length) return activeChapter ? (baseDays || []).map(day => ({ ...day, chapterId: activeChapter.id || day.chapterId || null })) : baseDays || []; const baseMeanings = (baseDays || []).flatMap(day => (day.phrases || []).map(p => p.ko)).filter(Boolean); return Array.from({ length: 7 }, (_, index) => { const day = index + 1; const assigned = pool.filter(expression => expression.studyDay === day); const rotated = [...pool.slice((index * 3) % pool.length), ...pool.slice(0, (index * 3) % pool.length)]; const selected = assigned.slice(0, 3); for (const expression of rotated) if (selected.length < 3 && !selected.some(p => p.id === expression.id)) selected.push(expression); while (selected.length < 3) selected.push(pool[selected.length % pool.length]); const repeatedPractice = new Set(selected.map(p => p.id)).size < 3; const phrases = selected.map(expression => ({ id: expression.id, chapterId: expression.chapterId, en: expression.en, ko: expression.ko, note: expression.note, kind: expression.kind, example: expression.example })); const quiz = selected.map((expression, qIndex) => { const wrong = [...new Set([...pool.map(p => p.ko), ...baseMeanings, '이 표현과 관련 없는 내용입니다.', '문장의 의미와 반대되는 내용입니다.', '다른 업무 상황을 설명하는 표현입니다.', '뜻이 일치하지 않는 선택지입니다.'])].filter(meaning => meaning !== expression.ko).slice(0, 2); const answer = (index + qIndex) % 3; const options = [...wrong]; options.splice(answer, 0, expression.ko); return { q: `“${expression.en}”의 뜻으로 알맞은 것은?`, options, answer, explanation: `${expression.en} → ${expression.ko}${expression.note ? ' · ' + expression.note : ''}` }; }); return { id: day, chapterId: activeChapter?.id || null, title: `오늘의 수업 표현 ${day}`, subtitle: activeChapter ? `${activeChapter.number}챕터 · ${activeChapter.title}` : '선생님이 등록한 표현으로 연습해요', icon: ['👋', '💼', '🎯', '💬', '🤝', '📊', '🏆'][index], phrases, dialogue: [{ speaker: 'A', en: 'Which expression would you use at work?', ko: '업무에서 어떤 표현을 써 볼까요?' }, { speaker: 'B', en: phrases[0].en, ko: phrases[0].ko }, { speaker: 'A', en: 'Can you give me an example?', ko: '예문을 말해 주실 수 있나요?' }, { speaker: 'B', en: phrases[0].example || phrases[1].en, ko: phrases[0].example ? '배운 표현을 내 업무 상황에 맞게 바꾸어 말해 보세요.' : phrases[1].ko }], prompt: `“${phrases[0].en}”를 내 업무 상황에 맞게 소리 내어 말해 보세요.`, example: phrases[0].example || phrases[0].en, quiz, repeatedPractice, note: repeatedPractice ? '등록된 표현이 3개 미만이라 같은 수업 표현을 반복 연습해요.' : assigned.length < 3 ? '다른 날에 등록된 수업 표현도 함께 복습해요.' : '' }; }); }

async function adminLearnerReport(env, url, now) {
  const month = url.searchParams.has('month') ? url.searchParams.get('month') : localDate(now).slice(0, 7);
  if (!/^20\d{2}-(0[1-9]|1[0-2])$/.test(month)) fail(400, 'invalid_month', '조회 월 확인');
  const roomValue = url.searchParams.get('roomId');
  const roomId = roomValue ? identifier(roomValue, '반') : null;
  const rooms = await all(env.DB, 'SELECT r.id, r.name, r.code, COUNT(m.user_id) AS memberCount FROM rooms r LEFT JOIN room_members m ON m.room_id = r.id GROUP BY r.id ORDER BY r.name, r.id');
  if (roomId && !rooms.some(room => room.id === roomId)) fail(404, 'room_not_found', '등록된 반 없음');
  const [year, monthNumber] = month.split('-').map(Number);
  const start = Date.UTC(year, monthNumber - 1, 1) - 9 * 3600000;
  const end = Date.UTC(year, monthNumber, 1) - 9 * 3600000;
  const selected = `SELECT p.* FROM profiles p WHERE (? IS NULL OR EXISTS (SELECT 1 FROM room_members m WHERE m.user_id = p.user_id AND m.room_id = ?))`;
  const sql = `WITH selected AS (${selected}),
    quest AS (
      SELECT r.user_id, SUM(r.seconds) AS studySeconds, SUM(r.points) AS questPoints
      FROM learning_rewards r JOIN selected p ON p.user_id = r.user_id WHERE r.month = ? GROUP BY r.user_id
    ),
    lessons AS (
      SELECT s.user_id, COUNT(*) AS completedLessons,
        COUNT(DISTINCT s.course || CHAR(31) || COALESCE(s.chapter_id,'') || CHAR(31) || CAST(s.day AS TEXT)) AS completedUniqueLessons
      FROM learning_sessions s JOIN selected p ON p.user_id = s.user_id
      WHERE s.finished_at >= ? AND s.finished_at < ? GROUP BY s.user_id
    ),
    games AS (
      SELECT r.user_id, COUNT(*) AS gameCount FROM activity_runs r JOIN selected p ON p.user_id = r.user_id
      WHERE r.finished_at >= ? AND r.finished_at < ? GROUP BY r.user_id
    ),
    quizzes AS (
      SELECT s.user_id, COUNT(*) AS quizAnswered, SUM(q.correct) AS quizCorrect
      FROM quiz_answers q JOIN learning_sessions s ON s.id = q.session_id JOIN selected p ON p.user_id = s.user_id
      WHERE q.answered_at >= ? AND q.answered_at < ? GROUP BY s.user_id
    ),
    answers AS (
      SELECT r.user_id, COUNT(*) AS gameQuestions, SUM(a.correct) AS gameCorrect
      FROM activity_answers a JOIN activity_runs r ON r.id = a.run_id JOIN selected p ON p.user_id = r.user_id
      WHERE a.answered_at >= ? AND a.answered_at < ? GROUP BY r.user_id
    ),
    awards AS (
      SELECT a.user_id, SUM(CASE WHEN a.category = 'study' THEN a.points ELSE 0 END) AS cardPoints,
        SUM(CASE WHEN a.category = 'game' THEN a.points ELSE 0 END) AS gamePoints
      FROM activity_awards a JOIN selected p ON p.user_id = a.user_id
      WHERE a.month = ? AND a.applied = 1 GROUP BY a.user_id
    ),
    cards AS (
      SELECT c.user_id, SUM(CASE WHEN c.known = 1 THEN 1 ELSE 0 END) AS flashcardKnown,
        SUM(c.attempts) AS reviewedCards, SUM(CASE WHEN c.attempts > 0 THEN 1 ELSE 0 END) AS reviewedCardCount
      FROM study_cards c JOIN selected p ON p.user_id = c.user_id GROUP BY c.user_id
    ),
    events AS (
      SELECT s.user_id, s.finished_at AS at FROM learning_sessions s JOIN selected p ON p.user_id = s.user_id WHERE s.finished_at IS NOT NULL
      UNION ALL SELECT s.user_id, q.answered_at FROM quiz_answers q JOIN learning_sessions s ON s.id = q.session_id JOIN selected p ON p.user_id = s.user_id
      UNION ALL SELECT r.user_id, r.finished_at FROM activity_runs r JOIN selected p ON p.user_id = r.user_id WHERE r.finished_at IS NOT NULL
      UNION ALL SELECT r.user_id, a.answered_at FROM activity_answers a JOIN activity_runs r ON r.id = a.run_id JOIN selected p ON p.user_id = r.user_id
      UNION ALL SELECT a.user_id, a.created_at FROM activity_awards a JOIN selected p ON p.user_id = a.user_id WHERE a.applied = 1
    ),
    activity AS (
      SELECT user_id, MAX(at) AS lastStudiedAt,
        MAX(CASE WHEN at >= ? AND at < ? THEN at ELSE NULL END) AS lastStudiedInMonthAt,
        COUNT(DISTINCT CASE WHEN at >= ? AND at < ? THEN STRFTIME('%Y-%m-%d', at / 1000, 'unixepoch', '+9 hours') ELSE NULL END) AS activeDays
      FROM events GROUP BY user_id
    )
    SELECT p.public_id AS id, p.nickname, p.avatar,
      COALESCE(q.studySeconds,0) AS studySeconds, COALESCE(l.completedLessons,0) AS completedLessons,
      COALESCE(l.completedUniqueLessons,0) AS completedUniqueLessons, COALESCE(g.gameCount,0) AS gameCount,
      COALESCE(z.quizAnswered,0) AS quizAnswered, COALESCE(z.quizCorrect,0) AS quizCorrect,
      COALESCE(a.gameQuestions,0) AS gameQuestions, COALESCE(a.gameCorrect,0) AS gameCorrect,
      COALESCE(q.questPoints,0) + COALESCE(w.cardPoints,0) AS studyPoints, COALESCE(w.gamePoints,0) AS gamePoints,
      COALESCE(q.questPoints,0) + COALESCE(w.cardPoints,0) + COALESCE(w.gamePoints,0) AS points,
      COALESCE(t.activeDays,0) AS activeDays, t.lastStudiedAt, t.lastStudiedInMonthAt,
      COALESCE(c.flashcardKnown,0) AS flashcardKnown, COALESCE(c.reviewedCards,0) AS reviewedCards,
      COALESCE(c.reviewedCardCount,0) AS reviewedCardCount
    FROM selected p LEFT JOIN quest q ON q.user_id = p.user_id LEFT JOIN lessons l ON l.user_id = p.user_id
      LEFT JOIN games g ON g.user_id = p.user_id LEFT JOIN quizzes z ON z.user_id = p.user_id
      LEFT JOIN answers a ON a.user_id = p.user_id LEFT JOIN awards w ON w.user_id = p.user_id
      LEFT JOIN cards c ON c.user_id = p.user_id LEFT JOIN activity t ON t.user_id = p.user_id
    ORDER BY studySeconds DESC, points DESC, p.nickname, p.public_id`;
  const [rows, memberships, passes] = await Promise.all([
    all(env.DB, sql, roomId, roomId, month, start, end, start, end, start, end, start, end, month, start, end, start, end),
    all(env.DB, `WITH selected AS (${selected}) SELECT p.public_id AS learnerId, r.id, r.name, r.code,
      CASE WHEN p.current_room_id = r.id THEN 1 ELSE 0 END AS isCurrent
      FROM selected p JOIN room_members m ON m.user_id = p.user_id JOIN rooms r ON r.id = m.room_id
      ORDER BY p.public_id, isCurrent DESC, r.name`, roomId, roomId),
    all(env.DB, `WITH selected AS (${selected})
      SELECT p.public_id AS learnerId, MAX(v.passed_at) AS lastStudiedAt,
        MAX(CASE WHEN v.passed_at >= ? AND v.passed_at < ? THEN v.passed_at ELSE NULL END) AS lastStudiedInMonthAt
      FROM daily_rail_passes v JOIN activity_runs r ON r.id = v.run_id
        JOIN selected p ON p.user_id = r.user_id GROUP BY p.public_id`, roomId, roomId, start, end)
  ]);
  // Daily corrections share the first attempt's KST date, already counted in activeDays.
  const latestPass = new Map(passes.map(pass => [pass.learnerId, pass]));
  for (const row of rows) {
    const pass = latestPass.get(row.id);
    if (!pass) continue;
    row.lastStudiedAt = Math.max(Number(row.lastStudiedAt || 0), Number(pass.lastStudiedAt || 0)) || null;
    row.lastStudiedInMonthAt = Math.max(Number(row.lastStudiedInMonthAt || 0), Number(pass.lastStudiedInMonthAt || 0)) || null;
  }
  const byLearner = new Map();
  for (const { learnerId, isCurrent, ...room } of memberships) { if (!byLearner.has(learnerId)) byLearner.set(learnerId, []); byLearner.get(learnerId).push({ ...room, isCurrent: !!isCurrent }); }
  const learners = rows.map(row => { const avatar = { species: 0 }; try { const parsed = JSON.parse(row.avatar || '{}'); if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) for (const [key, limit] of Object.entries({ species: 12, skin: 5, hair: 5, eyes: 3, outfit: 5, accessory: 5, color: 7 })) if (Number.isInteger(parsed[key]) && parsed[key] >= 0 && parsed[key] <= limit) avatar[key] = parsed[key]; } catch { /* Old malformed avatars use the UI fallback. */ } return { ...row, avatar, rooms: byLearner.get(row.id) || [] }; });
  const metrics = ['studySeconds','completedLessons','completedUniqueLessons','gameCount','quizAnswered','quizCorrect','gameQuestions','gameCorrect','studyPoints','gamePoints','points','activeDays','flashcardKnown','reviewedCards','reviewedCardCount'];
  const summary = { learnerCount: learners.length, activeLearners: learners.filter(learner => learner.activeDays > 0).length };
  for (const key of metrics) summary[key] = learners.reduce((sum, learner) => sum + Number(learner[key] || 0), 0);
  return { month, roomId, rooms, summary, learners, tracking: {
    time: '학습 시간: 퀘스트 보상 기록 기준 · 카드·게임 시간 제외',
    lessons: '완료 퀘스트: 재학습 포함 · 고유 레슨: 코스·챕터·일차 중복 제외',
    cards: '암기 카드·복습 횟수·복습 카드: 누적 기록 · 카드 학습 시간·복습 시각 미측정',
    activity: '최근 학습: 퀴즈·게임 답변·완료·학습 보상 시각 · 별표·프로필 변경 제외',
    scope: '반 필터: 소속 학생 기준 · 학습 지표: 사이트 전체 기록'
  } };
}

async function getTeachingContent(env, baseCourses = {}, now = Date.now()) {
  let rows = [], expressionRows = [], databaseRevision = 0;
  if (env.DB) { [rows, expressionRows, databaseRevision] = await Promise.all([all(env.DB, CHAPTER_SELECT + ' ORDER BY c.week_start, c.number, c.created_at'), all(env.DB, 'SELECT * FROM teacher_expressions WHERE deleted_at IS NULL ORDER BY study_day, created_at, id'), revision(env.DB)]); }
  const chapters = rows.filter(row => visibleChapter(row, now)).map(chapterView);
  const visibleIds = new Set(chapters.map(chapter => chapter.id));
  const expressions = expressionRows.filter(row => row.status === 'published' && (row.publish_at === null || row.publish_at <= now) && (!row.chapter_id || visibleIds.has(row.chapter_id))).map(expressionView);
  const activeChapter = chapters.at(-1) || null;
  const pool = expressions.filter(expression => !expression.chapterId || expression.chapterId === activeChapter?.id);
  const days = makeDays(pool, activeChapter, baseCourses.business || []);
  const cardView = ({ id, en, ko, note, kind, example, studyDay, chapterId }) => ({ id, en, ko, note, kind, example, studyDay, chapterId });
  const decks = chapters.map(chapter => ({ id: chapter.id, title: `${chapter.number}챕터 · ${chapter.title}`, chapterId: chapter.id, cards: expressions.filter(expression => expression.chapterId === chapter.id).map(cardView) })).filter(deck => deck.cards.length);
  const unassigned = expressions.filter(expression => !expression.chapterId);
  if (unassigned.length) decks.push({ id: 'daily-expressions', title: '오늘의 표현', chapterId: null, cards: unassigned.map(cardView) });
  for (const deck of decks) { const kinds = [...new Set(deck.cards.map(card => card.kind))]; deck.kind = kinds.length === 1 ? kinds[0] : 'mixed'; deck.categories = { words: deck.cards.filter(card => card.kind === '단어').map(card => card.id), speaking: deck.cards.filter(card => card.kind === '표현').map(card => card.id) }; }
  const dailyWords = expressions.filter(expression => expression.kind === '단어');
  const speakingExpressions = expressions.filter(expression => expression.kind === '표현');
  const contentRevision = rows.length || expressionRows.length || databaseRevision ? Number.parseInt((await hash(JSON.stringify({ databaseRevision, chapters, expressions }))).slice(0, 12), 16) : 0;
  return { content: { revision: contentRevision, activeChapter, chapters, expressions, days, decks, dailyWords, speakingExpressions, usingFallback: !pool.some(expression => expression.kind === '표현') }, courses: { ...baseCourses, business: days } };
}

async function handleTeaching(request, env, now = Date.now(), baseCourses = {}) {
  const url = new URL(request.url), path = url.pathname;
  if (!(path.startsWith('/api/admin/') || path === '/api/content' || path === '/api/notes' || path.startsWith('/api/pdf/'))) return null;
  try {
    if (!env.DB) fail(503, 'database_unavailable', '수업 저장소를 준비하고 있어요. 잠시 후 다시 시도해 주세요.');
    if (!['GET', 'POST', 'HEAD'].includes(request.method)) fail(405, 'method_not_allowed', '지원하지 않는 요청입니다.');
    if (request.method === 'POST') originCheck(request);
    if (path === '/api/content' && request.method === 'GET') return json((await getTeachingContent(env, baseCourses, now)).content);
    if (path === '/api/admin/login' && request.method === 'POST') {
      if (typeof env.ADMIN_PASSWORD !== 'string' || !env.ADMIN_PASSWORD) fail(503, 'admin_unconfigured', '관리자 비밀번호 설정을 확인해 주세요.');
      const body = await jsonBody(request);
      if (typeof body.password !== 'string' || body.password.length > 256) fail(400, 'password_required', '관리자 비밀번호를 입력해 주세요.');
      const ipHash = await hash(request.headers.get('cf-connecting-ip') || 'unknown');
      const failures = await first(env.DB, 'SELECT COUNT(*) AS n FROM teacher_login_attempts WHERE ip_hash = ? AND created_at > ?', ipHash, now - LOGIN_WINDOW);
      if (failures.n >= 5) fail(429, 'login_throttled', '로그인 시도가 많아요. 15분 뒤 다시 시도해 주세요.');
      const secretHash = await hash(env.ADMIN_PASSWORD);
      if (!sameHash(await hash(body.password), secretHash)) {
        const attemptId = crypto.randomUUID();
        await env.DB.prepare('INSERT INTO teacher_login_attempts (id, ip_hash, created_at) SELECT ?, ?, ? WHERE (SELECT COUNT(*) FROM teacher_login_attempts WHERE ip_hash = ? AND created_at > ?) < 5').bind(attemptId, ipHash, now, ipHash, now - LOGIN_WINDOW).run();
        if (!await first(env.DB, 'SELECT id FROM teacher_login_attempts WHERE id = ?', attemptId)) fail(429, 'login_throttled', '로그인 시도가 많아요. 15분 뒤 다시 시도해 주세요.');
        fail(401, 'invalid_password', '비밀번호가 맞지 않아요.');
      }
      const rawToken = token();
      await env.DB.batch([env.DB.prepare('INSERT INTO teacher_admin_sessions (token_hash, secret_hash, created_at, expires_at) VALUES (?, ?, ?, ?)').bind(await hash(rawToken), secretHash, now, now + SESSION_TTL), env.DB.prepare('DELETE FROM teacher_login_attempts WHERE ip_hash = ? OR created_at <= ?').bind(ipHash, now - LOGIN_WINDOW), env.DB.prepare('DELETE FROM teacher_admin_sessions WHERE expires_at <= ?').bind(now)]);
      return json({ authenticated: true, expiresAt: now + SESSION_TTL }, 200, { 'set-cookie': setCookie(rawToken) });
    }
    if (path === '/api/admin/logout' && request.method === 'POST') { await jsonBody(request); const raw = cookieValue(request); if (raw) await env.DB.prepare('DELETE FROM teacher_admin_sessions WHERE token_hash = ?').bind(await hash(raw)).run(); return json({ authenticated: false }, 200, { 'set-cookie': clearCookie() }); }
    if (path.startsWith('/api/admin/')) {
      if (!await adminSession(request, env, now)) return json({ authenticated: false, error: 'admin_auth_required', message: '관리자 로그인이 필요해요.' }, 401);
      if (['/api/admin/learners', '/api/admin/students'].includes(path) && request.method === 'GET') return json(await adminLearnerReport(env, url, now));
      if (path === '/api/admin/state' && request.method === 'GET') { const [chapters, expressions, rev] = await Promise.all([all(env.DB, CHAPTER_SELECT + ' ORDER BY c.week_start DESC, c.number DESC'), all(env.DB, 'SELECT * FROM teacher_expressions WHERE deleted_at IS NULL ORDER BY updated_at DESC'), revision(env.DB)]); return json({ authenticated: true, revision: rev, chapters: chapters.map(chapterView), expressions: expressions.map(expressionView) }); }
      if (path === '/api/admin/chapter' && request.method === 'POST') {
        const body = await jsonBody(request), id = body.id ? identifier(body.id, '챕터') : crypto.randomUUID();
        if (body.id && !await chapterRow(env.DB, id)) fail(404, 'chapter_not_found', '챕터를 찾을 수 없어요.');
        if (!Number.isInteger(body.number) || body.number < 1 || body.number > 999) fail(400, 'invalid_number', '챕터 번호는 1~999로 입력해 주세요.');
        if (!validDate(body.weekStart)) fail(400, 'invalid_week', '수업 시작 날짜를 다시 선택해 주세요.');
        const title = string(body.title, 120, '챕터 제목', true), text = string(body.body, 50000, '수업 내용'), state = status(body.status), publishAt = schedule(body.publishAt);
        await env.DB.batch([env.DB.prepare('INSERT INTO teacher_chapters (id, number, title, week_start, body, status, publish_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET number = excluded.number, title = excluded.title, week_start = excluded.week_start, body = excluded.body, status = excluded.status, publish_at = excluded.publish_at, updated_at = excluded.updated_at').bind(id, body.number, title, body.weekStart, text, state, publishAt, now, now), revisionStatement(env.DB, 'chapter', now)]);
        return json({ chapter: chapterView(await chapterRow(env.DB, id)), revision: await revision(env.DB) });
      }
      if (path === '/api/admin/chapter/delete' && request.method === 'POST') { const body = await jsonBody(request), id = identifier(body.id, '챕터'); if (!await chapterRow(env.DB, id)) fail(404, 'chapter_not_found', '챕터를 찾을 수 없어요.'); await env.DB.batch([env.DB.prepare("UPDATE teacher_chapters SET status = 'draft', updated_at = ? WHERE id = ?").bind(now, id), revisionStatement(env.DB, 'unpublish-chapter', now)]); return json({ unpublished: true, id, revision: await revision(env.DB) }); }
      // 수업을 완전히 지운다: PDF·학생 필기까지 함께 지우고, 연결된 단어·문장은 수업 연결만 끊어 남긴다.
      if (path === '/api/admin/chapter/remove' && request.method === 'POST') {
        const body = await jsonBody(request), id = identifier(body.id, '챕터'); const chapter = await chapterRow(env.DB, id);
        if (!chapter) fail(404, 'chapter_not_found', '챕터를 찾을 수 없어요.');
        await env.DB.batch([
          env.DB.prepare('UPDATE teacher_expressions SET chapter_id = NULL, updated_at = ? WHERE chapter_id = ?').bind(now, id),
          env.DB.prepare('DELETE FROM teacher_notes WHERE chapter_id = ?').bind(id),
          env.DB.prepare('DELETE FROM teacher_pdfs WHERE chapter_id = ?').bind(id),
          env.DB.prepare('UPDATE learning_sessions SET chapter_id = NULL WHERE chapter_id = ?').bind(id),
          env.DB.prepare('DELETE FROM teacher_chapters WHERE id = ?').bind(id),
          revisionStatement(env.DB, 'remove-chapter', now)
        ]);
        if (chapter.object_key && env.BUCKET) try { await env.BUCKET.delete(chapter.object_key); } catch { console.error('Removed chapter PDF cleanup deferred'); }
        return json({ removed: true, id, revision: await revision(env.DB) });
      }
      if (path === '/api/admin/expression' && request.method === 'POST') {
        const body = await jsonBody(request), id = body.id ? identifier(body.id, '표현') : crypto.randomUUID();
        if (body.id && !await first(env.DB, 'SELECT id FROM teacher_expressions WHERE id = ? AND deleted_at IS NULL', id)) fail(404, 'expression_not_found', '표현을 찾을 수 없어요.');
        const chapterId = body.chapterId ? identifier(body.chapterId, '챕터') : null;
        if (chapterId && !await chapterRow(env.DB, chapterId)) fail(404, 'chapter_not_found', '챕터를 찾을 수 없어요.');
        const en = string(body.en, 500, '영어 표현', true), ko = string(body.ko, 1000, '우리말 뜻', true), note = string(body.note, 2000, '표현 설명'), example = string(body.example, 2000, '예문'), state = status(body.status), publishAt = schedule(body.publishAt);
        if (!/[a-z]/i.test(en)) fail(400, 'invalid_english', '영어 표현을 입력해 주세요.');
        if (!['표현', '단어'].includes(body.kind)) fail(400, 'invalid_kind', '표현 또는 단어를 선택해 주세요.');
        if (!Number.isInteger(body.studyDay) || body.studyDay < 1 || body.studyDay > 7) fail(400, 'invalid_day', '복습 날짜는 Day 1~7로 선택해 주세요.');
        await env.DB.batch([env.DB.prepare('INSERT INTO teacher_expressions (id, chapter_id, en, ko, note, kind, example, study_day, status, publish_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET chapter_id = excluded.chapter_id, en = excluded.en, ko = excluded.ko, note = excluded.note, kind = excluded.kind, example = excluded.example, study_day = excluded.study_day, status = excluded.status, publish_at = excluded.publish_at, updated_at = excluded.updated_at').bind(id, chapterId, en, ko, note, body.kind, example, body.studyDay, state, publishAt, now, now), revisionStatement(env.DB, 'expression', now)]);
        return json({ expression: expressionView(await first(env.DB, 'SELECT * FROM teacher_expressions WHERE id = ?', id)), revision: await revision(env.DB) });
      }
      if (path === '/api/admin/expression/delete' && request.method === 'POST') { const body = await jsonBody(request), id = identifier(body.id, '표현'); if (!await first(env.DB, 'SELECT id FROM teacher_expressions WHERE id = ? AND deleted_at IS NULL', id)) fail(404, 'expression_not_found', '표현을 찾을 수 없어요.'); await env.DB.batch([env.DB.prepare('UPDATE teacher_expressions SET deleted_at = ?, updated_at = ? WHERE id = ?').bind(now, now, id), revisionStatement(env.DB, 'delete-expression', now)]); return json({ deleted: true, id, revision: await revision(env.DB) }); }
      if (path === '/api/admin/pdf' && request.method === 'POST') {
        if (!env.BUCKET) fail(503, 'storage_unavailable', 'PDF 저장소를 준비하고 있어요.');
        const chapterId = identifier(url.searchParams.get('chapterId'), '챕터');
        if (!await chapterRow(env.DB, chapterId)) fail(404, 'chapter_not_found', '챕터를 찾을 수 없어요.');
        if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/pdf')) fail(415, 'pdf_required', 'PDF 파일을 선택해 주세요.');
        const bytes = await readLimited(request, MAX_PDF);
        if (bytes.length < 5 || new TextDecoder('ascii').decode(bytes.slice(0, 5)) !== '%PDF-') fail(400, 'invalid_pdf', '올바른 PDF 파일을 선택해 주세요.');
        validatePDFEnvelope(bytes);
        let name; try { name = decodeURIComponent(request.headers.get('x-file-name') || 'lesson.pdf'); } catch { fail(400, 'invalid_filename', '파일 이름을 다시 확인해 주세요.'); }
        name = name.split(/[\\/]/).at(-1).replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 200) || 'lesson.pdf';
        const pageHeader = request.headers.get('x-pdf-pages');
        const pages = pageHeader ? Number(pageHeader) : null;
        if (pages !== null && (!Number.isInteger(pages) || pages < 1 || pages > 2000)) fail(400, 'invalid_pages', 'PDF 페이지 수를 확인해 주세요.');
        const previous = await first(env.DB, 'SELECT object_key FROM teacher_pdfs WHERE chapter_id = ?', chapterId);
        const key = 'teacher-pdf/' + crypto.randomUUID() + '.pdf';
        await env.BUCKET.put(key, bytes, { httpMetadata: { contentType: 'application/pdf' }, customMetadata: { chapterId } });
        try { await env.DB.batch([env.DB.prepare('INSERT INTO teacher_pdfs (chapter_id, object_key, name, size, pages, uploaded_at) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(chapter_id) DO UPDATE SET object_key = excluded.object_key, name = excluded.name, size = excluded.size, pages = excluded.pages, uploaded_at = excluded.uploaded_at').bind(chapterId, key, name, bytes.length, pages, now), env.DB.prepare('UPDATE teacher_chapters SET updated_at = ? WHERE id = ?').bind(now, chapterId), revisionStatement(env.DB, 'pdf', now)]); } catch (error) {
          // A rejected D1 response can still follow a committed write. Only a
          // confirmed non-reference permits cleanup; unreadable state keeps bytes safe.
          let unreferenced = false;
          try { const current = await first(env.DB, 'SELECT object_key FROM teacher_pdfs WHERE chapter_id = ?', chapterId); unreferenced = current === null || (typeof current?.object_key === 'string' && current.object_key !== key); }
          catch { console.error('Teaching PDF cleanup deferred: metadata state unknown'); }
          if (unreferenced) try { await env.BUCKET.delete(key); } catch { console.error('Teaching PDF cleanup deferred: object delete failed'); }
          throw error;
        }
        if (previous?.object_key) try { await env.BUCKET.delete(previous.object_key); } catch { console.error('Previous teaching PDF cleanup deferred'); }
        return json({ chapterId, pdf: pdfView(await chapterRow(env.DB, chapterId)), revision: await revision(env.DB) });
      }
      fail(404, 'not_found', '요청한 관리자 기능을 찾을 수 없어요.');
    }
    if (path.startsWith('/api/pdf/') && ['GET', 'HEAD'].includes(request.method)) {
      let id; try { id = decodeURIComponent(path.slice('/api/pdf/'.length)); } catch { fail(400, 'invalid_id', 'PDF를 다시 선택해 주세요.'); }
      identifier(id, '챕터'); const chapter = await chapterRow(env.DB, id);
      if (!chapter || !chapter.object_key || (!visibleChapter(chapter, now) && !await adminSession(request, env, now))) fail(404, 'pdf_not_found', '공개된 수업 PDF를 찾을 수 없어요.');
      if (!env.BUCKET) fail(503, 'storage_unavailable', 'PDF 저장소를 준비하고 있어요.');
      const object = await env.BUCKET.get(chapter.object_key);
      if (!object) fail(404, 'pdf_not_found', 'PDF 파일을 찾을 수 없어요.');
      return new Response(request.method === 'HEAD' ? null : object.body, { headers: { ...DEFAULT_HEADERS, 'content-type': 'application/pdf', 'content-length': String(chapter.pdf_size), 'content-disposition': `inline; filename="lesson.pdf"; filename*=UTF-8''${encodeURIComponent(chapter.pdf_name)}`, 'accept-ranges': 'none' } });
    }
    if (path === '/api/notes' && ['GET', 'POST'].includes(request.method)) {
      const body = request.method === 'POST' ? await jsonBody(request) : { chapterId: url.searchParams.get('chapterId'), page: Number(url.searchParams.get('page')) };
      const chapterId = identifier(body.chapterId, '챕터'), page = body.page;
      if (!Number.isInteger(page) || page < 1 || page > 2000) fail(400, 'invalid_page', 'PDF 페이지를 다시 선택해 주세요.');
      const userId = request.headers.get('x-aj-user-id');
      if (!userId) { if (request.method === 'GET') return json(noteView(null, chapterId, page, true)); fail(401, 'sign_in_required', '필기를 계정에 저장하려면 로그인해 주세요.'); }
      const chapter = await chapterRow(env.DB, chapterId);
      if (!chapter || (!visibleChapter(chapter, now) && !await adminSession(request, env, now))) fail(404, 'chapter_not_found', '공개된 수업 챕터를 찾을 수 없어요.');
      if (request.method === 'POST') { if (typeof body.text !== 'string' || body.text.length > 10000) fail(400, 'invalid_note', '필기 내용은 10,000자까지 저장할 수 있어요.'); const strokes = normalizedStrokes(body.strokes); await env.DB.prepare('INSERT INTO teacher_notes (user_id, chapter_id, page, text, strokes_json, updated_at) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(user_id, chapter_id, page) DO UPDATE SET text = excluded.text, strokes_json = excluded.strokes_json, updated_at = excluded.updated_at').bind(userId, chapterId, page, body.text, JSON.stringify(strokes), now).run(); }
      return json(noteView(await first(env.DB, 'SELECT text, strokes_json, updated_at FROM teacher_notes WHERE user_id = ? AND chapter_id = ? AND page = ?', userId, chapterId, page), chapterId, page));
    }
    fail(404, 'not_found', '요청한 수업 기능을 찾을 수 없어요.');
  } catch (error) { if (error instanceof TeachingError) return json({ error: error.code, message: error.message }, error.status); console.error('Teaching API failed:', error?.name || 'Error', String(error?.cause?.message || error?.message || '').slice(0, 240)); return json({ error: 'teaching_request_failed', message: '수업 내용을 저장하거나 불러오지 못했어요. 잠시 후 다시 시도해 주세요.' }, 500); }
}

return { handleTeaching, getTeachingContent };
})();
const Activity = (() => {

const aj = (data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
class ActivityError extends Error{constructor(status,message,details={}){super(message);this.status=status;this.details=details;}}
function ae(status,message,details){throw new ActivityError(status,message,details);}
async function af(db,sql,...args){return db.prepare(sql).bind(...args).first();}
async function aa(db,sql,...args){return (await db.prepare(sql).bind(...args).all()).results||[];}
function adate(now){return new Date(now+32400000).toISOString().slice(0,10);}
const ACT_CONTRACTIONS = { "i'm":'i am', "you're":'you are', "we're":'we are', "they're":'they are', "he's":'he is', "she's":'she is', "it's":'it is', "that's":'that is', "what's":'what is', "there's":'there is', "don't":'do not', "doesn't":'does not', "didn't":'did not', "can't":'cannot', "couldn't":'could not', "won't":'will not', "wouldn't":'would not', "shouldn't":'should not', "isn't":'is not', "aren't":'are not', "wasn't":'was not', "weren't":'were not', "i've":'i have', "you've":'you have', "we've":'we have', "they've":'they have', "i'll":'i will', "you'll":'you will', "we'll":'we will', "they'll":'they will', "i'd":'i would', "you'd":'you would', "we'd":'we would', "they'd":'they would', "let's":'let us' };
function anorm(s){return String(s||'').normalize('NFKC').toLowerCase().replace(/[’‘]/g,"'").replace(/\b[a-z]+'[a-z]+\b/g,w=>ACT_CONTRACTIONS[w]||w).replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim();}
function adecode(s){try{return JSON.parse(s);}catch{return {};}}
async function ar(db,user,profile){if(!profile?.current_room_id)return null;return af(db,'SELECT r.id,r.name,r.code,(SELECT COUNT(*) FROM room_members WHERE room_id=r.id) AS memberCount FROM rooms r JOIN room_members m ON m.room_id=r.id AND m.user_id=? WHERE r.id=?',user,profile.current_room_id);}
function acards(content,fallback){const rows=[...(content?.decks||[]).flatMap(d=>d.cards||[]),...fallback];const map=new Map();for(const c of rows)if(c?.id&&c.en&&c.ko)map.set(c.id,c);return [...map.values()];}
function adayHash(value){let result=2166136261;for(const letter of value){result^=letter.charCodeAt(0);result=Math.imul(result,16777619);}return result>>>0;}
function arotate(rows,offset){if(!rows.length)return[];const index=offset%rows.length;return [...rows.slice(index),...rows.slice(0,index)];}
function acollection(content,cards,collection){
 const words=Array.isArray(content?.dailyWords)?content.dailyWords:[],speaking=Array.isArray(content?.speakingExpressions)?content.speakingExpressions:[],phrases=content?.days?.[5]?.phrases||[];
 const candidates=collection==='words'?[...words.filter(c=>c.kind!=='표현'),...cards.filter(c=>c.kind==='단어')]:[...speaking.filter(c=>c.kind!=='단어'),...phrases.filter(c=>c.kind!=='단어'),...cards.filter(c=>c.kind!=='단어')];
 const seen=new Set(),source=[];for(const card of candidates){const key=anorm(card?.en);if(!key||!card?.ko||seen.has(key))continue;seen.add(key);source.push(card);}return source;
}
function acard(card,index,collection){return{id:card.id||'round-'+index,en:card.en,ko:card.ko,note:card.note||'',kind:card.kind||(collection==='words'?'단어':'표현'),studyDay:Number.isInteger(card.studyDay)&&card.studyDay>=1&&card.studyDay<=7?card.studyDay:null};}
function agrade(run,challenge,index,value){const card=challenge.cards[index],english=run.mode!=='listening'||card.answerType==='english',expected=english?card.en:card.ko;return{expected,correct:english?anorm(value)===anorm(expected):String(value||'').trim()===String(expected).trim()};}
function adailyDate(run,challenge,today){if(challenge.daily===true&&run.local_date!==today)ae(409,'새 날짜의 문제 확인',{restartDaily:true,today});}
async function amastery(db,user){
 const history=await aa(db,`SELECT r.challenge_json,a.question_index FROM activity_answers a JOIN activity_runs r ON r.id=a.run_id WHERE r.user_id=? AND a.correct=1 UNION SELECT r.challenge_json,p.question_index FROM daily_rail_passes p JOIN activity_runs r ON r.id=p.run_id WHERE r.user_id=?`,user,user);
 const ids=new Set(),english=new Set();for(const row of history){const card=adecode(row.challenge_json).cards?.[row.question_index];if(card?.id)ids.add(String(card.id));if(card?.en)english.add(anorm(card.en));}return{ids,english};
}
async function adailyState(db,run,now,resumed){
 const challenge=adecode(run.challenge_json),answers=await aa(db,`SELECT a.question_index AS [index],a.answer,a.correct,EXISTS(SELECT 1 FROM daily_rail_passes p WHERE p.run_id=a.run_id AND p.question_index=a.question_index) AS passed,COALESCE(w.points,0) AS pointsAwarded,COALESCE(w.coins,0) AS coins FROM activity_answers a LEFT JOIN activity_awards w ON w.id='answer:'||a.run_id||':'||a.question_index AND w.applied=1 WHERE a.run_id=? ORDER BY a.question_index`,run.id);
 const totals=await af(db,'SELECT COALESCE(SUM(points),0) AS earnedPoints,COALESCE(SUM(coins),0) AS earnedCoins,COALESCE(SUM(CASE WHEN id=? THEN points ELSE 0 END),0) AS completionPoints FROM activity_awards WHERE user_id=? AND applied=1 AND (id=? OR id LIKE ?)',run.id,run.user_id,run.id,'answer:'+run.id+':%');
 const normalized=answers.map(a=>({...a,correct:!!a.correct,firstCorrect:!!a.correct,passed:!!a.passed,points:a.pointsAwarded}));
 return{runId:run.id,mode:run.mode,challenge,startedAt:run.started_at,daily:true,practice:challenge.practice===true,date:run.local_date,today:adate(now),resumed,finished:!!run.finished_at,answers:normalized,progress:{answered:answers.length,correct:answers.filter(a=>a.correct).length,passed:answers.filter(a=>a.passed).length,total:challenge.cards.length},...totals};
}
async function adailyStart(db,{user,room,collection,content,cards,now,practice}){
 const date=adate(now),goal=await af(db,"SELECT * FROM activity_runs WHERE user_id=? AND local_date=? AND json_extract(challenge_json,'$.daily')=1 AND json_extract(challenge_json,'$.collection')=? AND COALESCE(json_extract(challenge_json,'$.practice'),0)=0 LIMIT 1",user,date,collection);
 if(!practice&&goal)return adailyState(db,goal,now,true);
 if(practice){if(!goal?.finished_at)ae(409,'오늘 10문제 완료 후 추가 연습');const active=await af(db,"SELECT * FROM activity_runs WHERE user_id=? AND local_date=? AND json_extract(challenge_json,'$.daily')=1 AND json_extract(challenge_json,'$.collection')=? AND json_extract(challenge_json,'$.practice')=1 AND finished_at IS NULL LIMIT 1",user,date,collection);if(active)return adailyState(db,active,now,true);}
 const count=await af(db,'SELECT COUNT(*) AS n FROM activity_runs WHERE user_id=? AND local_date=?',user,date);if(count.n>=100)ae(429,'오늘의 연습 기록 한도');
 const source=acollection(content,cards,collection);if(!source.length)ae(409,collection==='words'?'등록된 영단어 없음':'등록된 말하기 문장 없음');
 const mastered=await amastery(db,user),known=card=>mastered.english.has(anorm(card.en));
 const teacherIds=new Set((collection==='words'?content?.dailyWords||[]:content?.speakingExpressions||[]).map(c=>String(c.id))),teacherEnglish=new Set((collection==='words'?content?.dailyWords||[]:content?.speakingExpressions||[]).map(c=>anorm(c.en)));
 const isTeacher=card=>teacherIds.has(String(card.id))||teacherEnglish.has(anorm(card.en));
 const round=practice?(await af(db,"SELECT COUNT(*) AS n FROM activity_runs WHERE user_id=? AND local_date=? AND json_extract(challenge_json,'$.daily')=1 AND json_extract(challenge_json,'$.collection')=? AND json_extract(challenge_json,'$.practice')=1",user,date,collection)).n+1:0;
 const seed=adayHash(date+':'+collection+':'+round),ordered=[];
 for(const wasKnown of [false,true])for(const teacher of [true,false])ordered.push(...arotate(source.filter(card=>known(card)===wasKnown&&isTeacher(card)===teacher),seed));
 const selected=Array.from({length:10},(_,index)=>ordered[index%ordered.length]),seen=new Set();
 const chosen=selected.map((card,index)=>{const key=anorm(card.en),repeated=seen.has(key);seen.add(key);const base=acard(card,index,collection),raw=globalThis.AJQuizOptions?.distractors?.(base,source,3)||[],wrong=[...new Set(raw.filter(x=>typeof x==='string'&&x.trim()&&x.trim()!==String(base.ko).trim()).map(x=>x.trim()))].slice(0,3);return{...base,distractors:wrong,answerType:wrong.length===3?'meaning':'english',review:known(card)||repeated,repeated};});
 const challenge={daily:true,practice:!!practice,date,collection,cards:chosen,allowedCardIds:[],reviewCount:chosen.filter(c=>c.review).length,repeatedPractice:chosen.some(c=>c.repeated),bankExhausted:source.every(known),note:chosen.some(c=>c.repeated)?'등록 문제 부족 · 일부 반복 복습':chosen.some(c=>c.review)?'미학습 문제 우선 · 일부 이전 문제 복습':''};
 const id=crypto.randomUUID();await db.prepare('INSERT OR IGNORE INTO activity_runs (id,user_id,room_id,mode,challenge_json,started_at,local_date) VALUES (?,?,?,?,?,?,?)').bind(id,user,room||null,'listening',JSON.stringify(challenge),now,date).run();
 const saved=await af(db,`SELECT * FROM activity_runs WHERE user_id=? AND local_date=? AND json_extract(challenge_json,'$.daily')=1 AND json_extract(challenge_json,'$.collection')=? AND COALESCE(json_extract(challenge_json,'$.practice'),0)=? ${practice?'AND finished_at IS NULL':''} ORDER BY started_at DESC LIMIT 1`,user,date,collection,Number(!!practice));
 return adailyState(db,saved,now,saved.id!==id);
}
async function award(db,{id,user,room,category,mode,points,coins=0,seconds=0,now,cap,answer=null,completeRun=null,pass=null,noReward=false}){
 const date=adate(now),month=date.slice(0,7),queries=[];
 if(answer)queries.push(db.prepare('INSERT OR IGNORE INTO activity_answers (run_id,question_index,answer,correct,answered_at) SELECT ?,?,?,?,? WHERE EXISTS(SELECT 1 FROM activity_runs WHERE id=? AND user_id=? AND finished_at IS NULL)').bind(answer.runId,answer.index,answer.value,Number(answer.correct),now,answer.runId,user));
 if(pass)queries.push(db.prepare('INSERT OR IGNORE INTO daily_rail_passes (run_id,question_index,passed_at) SELECT ?,?,? WHERE EXISTS(SELECT 1 FROM activity_runs WHERE id=? AND user_id=? AND finished_at IS NULL)').bind(pass.runId,pass.index,now,pass.runId,user));
 const awardIndex=queries.length;
 let requested='?',requestedArgs=[points],conditions='1=1',conditionArgs=[];
 if(completeRun){
  requested="MAX(0,(CASE WHEN EXISTS(SELECT 1 FROM activity_answers WHERE run_id=?) THEN 4+2*COALESCE((SELECT SUM(correct) FROM activity_answers WHERE run_id=?),0) ELSE ? END)-COALESCE((SELECT SUM(points) FROM activity_awards WHERE id LIKE ?),0))";
  requestedArgs=[completeRun,completeRun,points,'answer:'+completeRun+':%'];
  conditions='EXISTS(SELECT 1 FROM activity_runs WHERE id=? AND user_id=? AND finished_at IS NULL)';conditionArgs=[completeRun,user];
 }else if(answer){
  conditions='EXISTS(SELECT 1 FROM activity_runs WHERE id=? AND user_id=? AND finished_at IS NULL) AND EXISTS(SELECT 1 FROM activity_answers WHERE run_id=? AND question_index=? AND correct=1)';conditionArgs=[answer.runId,user,answer.runId,answer.index];
 }
 if(noReward){conditions='0=1';conditionArgs=[];}
 queries.push(db.prepare(`INSERT OR IGNORE INTO activity_awards (id,user_id,room_id,category,mode,points,coins,seconds,local_date,month,created_at) SELECT ?,?,?,?,?,MIN(${requested},MAX(0,?-COALESCE((SELECT SUM(points) FROM activity_awards WHERE user_id=? AND local_date=? AND category=?),0))),0,?,?,?,? WHERE ${conditions}`).bind(id,user,room,category,mode,...requestedArgs,cap,user,date,category,seconds,date,month,now,...conditionArgs));
 // Daily cumulative rounding preserves ten game XP => two coins with split awards.
 queries.push(db.prepare("UPDATE activity_awards SET coins=CASE WHEN category='game' THEN MAX(0,MIN(8,CAST(COALESCE((SELECT SUM(points) FROM activity_awards WHERE user_id=? AND local_date=? AND category='game'),0)/5 AS INTEGER))-COALESCE((SELECT SUM(coins) FROM activity_awards WHERE user_id=? AND local_date=? AND category='game' AND id<>? AND applied=1),0)) ELSE 0 END WHERE id=? AND applied=0").bind(user,date,user,date,id,id));
 queries.push(db.prepare('UPDATE profiles SET total_points=total_points+(SELECT points FROM activity_awards WHERE id=? AND applied=0),coins=coins+(SELECT coins FROM activity_awards WHERE id=? AND applied=0) WHERE user_id=? AND EXISTS(SELECT 1 FROM activity_awards WHERE id=? AND applied=0)').bind(id,id,user,id));
 queries.push(db.prepare('UPDATE activity_awards SET applied=1 WHERE id=? AND applied=0').bind(id));
 if(completeRun)queries.push(db.prepare('UPDATE activity_runs SET finished_at=? WHERE id=? AND user_id=? AND finished_at IS NULL').bind(now,completeRun,user));
 const results=await db.batch(queries),inserted=Number(results[awardIndex]?.meta?.changes||0)>0;
 const row=inserted?await af(db,'SELECT points,coins FROM activity_awards WHERE id=?',id):null;
 return {...(row||{points:0,coins:0}),answerInserted:!!answer&&Number(results[0]?.meta?.changes||0)>0};
}
async function handleActivity(request,env,content,fallback=[],now=Date.now()){
 const url=new URL(request.url),p=url.pathname;
 if(!p.startsWith('/api/activity/')&&p!='/api/study/cards'&&p!='/api/mvp')return null;
 try{
  if(!env.DB)ae(503,'학습 저장소를 준비하고 있어요.');
  const db=env.DB,user=request.headers.get('x-aj-user-id'),today=adate(now),month=today.slice(0,7);
  const profile=user?await af(db,'SELECT * FROM profiles WHERE user_id=?',user):null;
  const room=user?await ar(db,user,profile):null;
  if(p==='/api/mvp'&&request.method==='GET'){
   const selected=url.searchParams.get('month')||month;if(!/^20\d{2}-(0[1-9]|1[0-2])$/.test(selected))ae(400,'올바른 월을 선택해 주세요.');
   if(!room)return aj({authenticated:!!user,month:selected,room:null,categories:{overall:[],study:[],game:[]},winners:{overall:null,study:null,game:null}});
   const rows=await aa(db,`SELECT p.public_id AS id,p.nickname,p.avatar,COALESCE(e.studyPoints,0) AS studyPoints,COALESCE(e.gamePoints,0) AS gamePoints,COALESCE(e.studyPoints,0)+COALESCE(e.gamePoints,0) AS points,COALESCE(e.activeDays,0) AS activeDays,COALESCE(e.seconds,0) AS seconds FROM room_members m JOIN profiles p ON p.user_id=m.user_id LEFT JOIN (SELECT user_id,SUM(studyPoints) AS studyPoints,SUM(gamePoints) AS gamePoints,COUNT(DISTINCT CASE WHEN studyPoints+gamePoints>0 THEN local_date END) AS activeDays,SUM(seconds) AS seconds FROM (SELECT user_id,local_date,points AS studyPoints,0 AS gamePoints,seconds FROM learning_rewards WHERE room_id=? AND month=? UNION ALL SELECT user_id,local_date,CASE WHEN category='study' THEN points ELSE 0 END AS studyPoints,CASE WHEN category='game' THEN points ELSE 0 END AS gamePoints,seconds FROM activity_awards WHERE room_id=? AND month=? AND applied=1) GROUP BY user_id) e ON e.user_id=m.user_id WHERE m.room_id=?`,room.id,selected,room.id,selected,room.id);
   const clean=rows.map(r=>({...r,avatar:adecode(r.avatar),isMe:r.id===profile.public_id}));const categories={};
   for(const [name,key]of Object.entries({overall:'points',study:'studyPoints',game:'gamePoints'})){let last='',rank=0;categories[name]=[...clean].sort((a,b)=>b[key]-a[key]||b.activeDays-a.activeDays||a.nickname.localeCompare(b.nickname)).map((r,i)=>{const k=r[key]+':'+r.activeDays;if(k!==last){rank=i+1;last=k;}return {...r,rank:r[key]>0?rank:null,categoryPoints:r[key]};});}
   return aj({authenticated:true,month:selected,room,categories,winners:Object.fromEntries(Object.entries(categories).map(([k,v])=>[k,v.find(r=>r.categoryPoints>0)||null])),rules:'학습 MVP는 20분 퀘스트와 단어장 학습 포인트, 게임 MVP는 게임 완료 포인트로 계산해요. 종합 MVP는 두 점수의 합이에요. 한국 시간 매월 1일 새로 시작하며 동점은 학습일 수를 비교해요.'});
  }
  if(p==='/api/study/cards'&&request.method==='GET')return aj({authenticated:!!user,cards:user?await aa(db,'SELECT card_id AS cardId,known,starred,attempts,updated_at AS updatedAt FROM study_cards WHERE user_id=?',user):[]});
  if(!user)ae(401,'포인트와 기록을 저장하려면 로그인해 주세요.');
  if(!profile)ae(409,'먼저 캐릭터와 별명을 만들어 주세요.');
  if(request.method!=='POST')ae(405,'지원하지 않는 요청입니다.');
  if(request.headers.get('origin')&&request.headers.get('origin')!==url.origin)ae(403,'사이트 안에서 다시 시도해 주세요.');
  if(!request.headers.get('content-type')?.includes('application/json'))ae(415,'JSON 요청이 필요해요.');
  const raw=await request.text();if(raw.length>100000)ae(413,'입력 내용이 너무 길어요.');let body;try{body=JSON.parse(raw);}catch{ae(400,'입력 형식을 확인해 주세요.');}if(!body||typeof body!=='object'||Array.isArray(body))ae(400,'입력 형식을 확인해 주세요.');
  const cards=acards(content,fallback),byId=new Map(cards.map(c=>[c.id,c]));
  if(p==='/api/study/cards'){
   const c=byId.get(body.cardId);if(!c)ae(400,'현재 단어장의 항목을 선택해 주세요.');
   if(typeof body.known!=='boolean'&&body.known!==0&&body.known!==1)ae(400,'학습 상태를 확인해 주세요.');
   const previous=await af(db,'SELECT starred FROM study_cards WHERE user_id=? AND card_id=?',user,c.id);const star=body.starred===undefined?previous?.starred||0:Number(!!body.starred);
   await db.prepare('INSERT INTO study_cards (user_id,card_id,known,starred,attempts,updated_at) VALUES (?,?,?,?,?,?) ON CONFLICT(user_id,card_id) DO UPDATE SET known=excluded.known,starred=excluded.starred,attempts=study_cards.attempts+excluded.attempts,updated_at=excluded.updated_at').bind(user,c.id,Number(!!body.known),star,body.review===false?0:1,now).run();
   const key='card:'+user+':'+today+':'+c.id;const already=await af(db,'SELECT id FROM activity_awards WHERE id=?',key);let result={points:0,coins:0};
   if(body.known&&body.review!==false&&!already)result=await award(db,{id:key,user,room:room?.id||null,category:'study',mode:'flashcards',points:2,now,cap:30});
   const saved=await af(db,'SELECT card_id AS cardId,known,starred,attempts,updated_at AS updatedAt FROM study_cards WHERE user_id=? AND card_id=?',user,c.id);return aj({...saved,points:result.points,coins:result.coins});
  }
  if(p==='/api/activity/start'){
   const mode=body.mode;if(!['arrange','listening','speaking','cards'].includes(mode))ae(400,'올바른 게임을 선택해 주세요.');
   if(body.collection!==undefined&&!['words','speaking'].includes(body.collection))ae(400,'학습 모음 확인');
   if(body.daily!==undefined&&typeof body.daily!=='boolean')ae(400,'일일 문제 설정 확인');
   if(body.practice!==undefined&&typeof body.practice!=='boolean')ae(400,'추가 연습 설정 확인');
   if(body.daily===true){if(mode!=='listening'||!['words','speaking'].includes(body.collection))ae(400,'일일 문제 학습 분류 확인');return aj(await adailyStart(db,{user,room:room?.id||null,collection:body.collection,content,cards,now,practice:body.practice===true}));}
   if(body.practice===true)ae(400,'일일 문제의 추가 연습만 지원');
   const count=await af(db,'SELECT COUNT(*) AS n FROM activity_runs WHERE user_id=? AND local_date=?',user,today);if(count.n>=100)ae(429,'오늘은 충분히 연습했어요. 포인트 없이 자유 연습을 이어갈 수 있어요.');
   if(body.sourceRunId!==undefined&&(typeof body.sourceRunId!=='string'||body.sourceRunId.length>100))ae(400,'이전 게임 기록 확인');
   let challenge=null;
   if(body.sourceRunId){const old=await af(db,'SELECT challenge_json FROM activity_runs WHERE id=? AND user_id=? AND mode=?',body.sourceRunId,user,mode);if(old){const saved=adecode(old.challenge_json);if(Array.isArray(saved.cards)&&saved.cards.length===3)challenge=saved;}}
   if(!challenge){
    let source;
    if(body.collection){
     const dailyWords=Array.isArray(content?.dailyWords)?content.dailyWords:[],speaking=Array.isArray(content?.speakingExpressions)?content.speakingExpressions:[],phrases=content?.days?.[5]?.phrases||[];
     const candidates=body.collection==='words'?[...dailyWords.filter(c=>c.kind!=='표현'),...cards.filter(c=>c.kind==='단어')]:[...speaking.filter(c=>c.kind!=='단어'),...phrases.filter(c=>c.kind!=='단어'),...cards.filter(c=>c.kind!=='단어')];
     const seen=new Set();source=[];
     for(const card of candidates){const key=anorm(card?.en);if(!key||!card?.ko||seen.has(key))continue;seen.add(key);source.push(card);}
     if(!source.length&&body.collection==='words')ae(409,'등록된 영단어 없음');
    }else source=content?.days?.[5]?.phrases||cards.slice(0,3);
    if(source.length<3)ae(409,body.collection==='words'?'영단어 3개 이상 필요':body.collection==='speaking'?'말하기 문장 3개 이상 필요':'게임 표현을 세 개 이상 준비해 주세요.');
    challenge={cards:source.slice(0,3).map((c,i)=>({id:c.id||'round-'+i,en:c.en,ko:c.ko,note:c.note||'',kind:c.kind||(body.collection==='words'?'단어':'표현'),studyDay:Number.isInteger(c.studyDay)&&c.studyDay>=1&&c.studyDay<=7?c.studyDay:null})),allowedCardIds:mode==='cards'?cards.map(c=>c.id):[],...(body.collection?{collection:body.collection}:{})};
   }
   const id=crypto.randomUUID();await db.prepare('INSERT INTO activity_runs (id,user_id,room_id,mode,challenge_json,started_at,local_date) VALUES (?,?,?,?,?,?,?)').bind(id,user,room?.id||null,mode,JSON.stringify(challenge),now,today).run();return aj({runId:id,mode,challenge,startedAt:now});
  }
  if(p==='/api/activity/answer'){
   if(typeof body.runId!=='string'||body.runId.length>100)ae(400,'게임 기록 확인');
   const run=await af(db,'SELECT * FROM activity_runs WHERE id=? AND user_id=?',body.runId,user);if(!run)ae(404,'게임 기록 없음');
   const ch=adecode(run.challenge_json);adailyDate(run,ch,today);
   if(run.finished_at)ae(409,'완료된 게임');if(!['arrange','listening','speaking'].includes(run.mode))ae(400,'문제별 보상 미지원');
   const elapsed=now-run.started_at;if(ch.daily!==true&&elapsed>7200000)ae(409,'게임 시간 만료');
   const total=ch.cards?.length||0;
   if(!Number.isInteger(body.index)||body.index<0||body.index>=total)ae(400,'문제 번호 확인');
   if(typeof body.answer!=='string'||body.answer.length>2000)ae(400,'답안 형식 확인');
   const previous=await af(db,'SELECT * FROM activity_answers WHERE run_id=? AND question_index=?',run.id,body.index);
   const minimum=2000*(body.index+1);if(!previous&&elapsed<minimum)ae(409,'풀이 시간 확인',{retryAfterMs:minimum-elapsed});
   const grade=agrade(run,ch,body.index,body.answer),expected=grade.expected,correct=grade.correct;
   const result=await award(db,{id:'answer:'+run.id+':'+body.index,user,room:room?.id||null,category:'game',mode:run.mode,points:2,now,cap:40,answer:{runId:run.id,index:body.index,value:body.answer,correct},pass:ch.daily===true&&correct?{runId:run.id,index:body.index}:null,noReward:ch.practice===true});
   const saved=await af(db,'SELECT answer,correct FROM activity_answers WHERE run_id=? AND question_index=?',run.id,body.index);
   if(!saved)ae(409,'완료된 게임');
   const progress=await af(db,'SELECT COUNT(*) AS answered,COALESCE(SUM(correct),0) AS correct FROM activity_answers WHERE run_id=?',run.id);
   if(ch.daily===true){const state=await adailyState(db,run,now,true),record=state.answers.find(a=>a.index===body.index);return aj({index:body.index,answer:saved.answer,correct:!!saved.correct,firstCorrect:!!saved.correct,passed:!!record?.passed,correctAnswer:expected,points:result.points,coins:result.coins,pointsAwarded:record?.pointsAwarded||0,alreadyAnswered:!result.answerInserted,progress:state.progress,earnedPoints:state.earnedPoints,earnedCoins:state.earnedCoins,dailyCap:40});}
   return aj({index:body.index,answer:saved.answer,correct:!!saved.correct,correctAnswer:expected,points:result.points,coins:result.coins,alreadyAnswered:!result.answerInserted,progress:{...progress,total},dailyCap:40});
  }
  if(p==='/api/activity/complete'){
   if(typeof body.runId!=='string'||body.runId.length>100)ae(400,'게임 기록 확인');
   const run=await af(db,'SELECT * FROM activity_runs WHERE id=? AND user_id=?',body.runId,user);if(!run)ae(404,'이 계정의 게임 기록을 찾을 수 없어요.');
   const ch=adecode(run.challenge_json);adailyDate(run,ch,today);
   if(run.finished_at){if(ch.daily===true){const state=await adailyState(db,run,now,true);return aj({points:0,coins:0,alreadyFinished:true,score:state.progress.correct,total:state.progress.total,finished:true,earnedPoints:state.earnedPoints,earnedCoins:state.earnedCoins,completionPoints:state.completionPoints,progress:state.progress});}return aj({points:0,coins:0,alreadyFinished:true});}
   const seconds=Math.max(0,Math.floor((now-run.started_at)/1000));if(seconds<8)ae(409,'조금 더 연습한 뒤 완료해 주세요.',{retryAfterMs:8000-(now-run.started_at)});if(ch.daily!==true&&seconds>7200)ae(409,'게임 시간이 지나서 새로 시작해 주세요.');
   let score=0,total=ch.daily===true?ch.cards.length:3;
   if(run.mode==='cards'){
    if(!Array.isArray(body.cardIds))ae(400,'완료한 단어 목록을 확인해 주세요.');const ids=[...new Set(body.cardIds)];if(ids.length<3||ids.length>500||ids.some(id=>!ch.allowedCardIds.includes(id))||!Number.isInteger(body.correct)||!Number.isInteger(body.total)||body.total<3||body.correct!==body.total||body.total!==ids.length||body.total>500)ae(400,'세 개 이상의 항목을 정확히 완료하면 게임 보상을 받을 수 있어요.');score=3;
   }else{
    if(!Array.isArray(body.answers)||body.answers.length!==total)ae(400,ch.daily===true?'10문제 답안 확인':'세 문제를 모두 완료해 주세요.');
   if(ch.daily===true){const state=await adailyState(db,run,now,true);if(state.progress.answered!==total||state.progress.passed!==total)ae(409,'10문제 정답 확인 필요',{progress:state.progress});}
    for(let i=0;i<total;i++){const answer=typeof body.answers[i]==='string'?body.answers[i]:body.answers[i]?.answer;if(agrade(run,ch,i,answer).correct)score++;}
    if(run.mode!=='listening'&&score!==total)ae(400,'모든 표현을 정확히 완료해야 해요.');
   }
   const reward=await award(db,{id:run.id,user,room:room?.id||null,category:'game',mode:run.mode,points:Math.round(2+8*score/total),coins:2,seconds:Math.min(seconds,300),now,cap:40,completeRun:run.id,noReward:ch.practice===true});
   const firstAttempts=await af(db,'SELECT COUNT(*) AS answered,COALESCE(SUM(correct),0) AS correct FROM activity_answers WHERE run_id=?',run.id);
   if(firstAttempts.answered)score=firstAttempts.correct;
   if(ch.daily===true){const state=await adailyState(db,{...run,finished_at:now},now,true);return aj({points:reward.points,coins:reward.coins,score,total,seconds,dailyCap:40,finished:true,earnedPoints:state.earnedPoints,earnedCoins:state.earnedCoins,completionPoints:state.completionPoints,progress:state.progress});}
   return aj({points:reward.points,coins:reward.coins,score,total,seconds,dailyCap:40});
  }
  ae(404,'요청한 기능을 찾을 수 없어요.');
 }catch(error){if(error instanceof ActivityError)return aj({error:'activity_error',message:error.message,...error.details},error.status);console.error('Activity API failed',error?.name);return aj({error:'activity_failed',message:'학습 기록을 저장하지 못했어요. 잠시 후 다시 시도해 주세요.'},500);}
}

return { handleActivity };
})();

const BASE_CARDS = [...BUSINESS_DATA.map((c, i) => ({ ...c, id: 'builtin-business-' + i })), ...DATA.map((c, i) => ({ ...c, id: 'builtin-foundation-' + i }))];
/** /api/* 요청 하나를 처리한다. env = { DB, BUCKET, ADMIN_PASSWORD } */
export async function handleCore(request, env) {
  const special = await Teaching.handleTeaching(request, env, Date.now(), COURSE_DATA); if (special) return special;
  const model = await Teaching.getTeachingContent(env, COURSE_DATA);
  const activity = await Activity.handleActivity(request, env, model.content, BASE_CARDS); if (activity) return activity;
  return handleApi(request, env, model.courses);
}

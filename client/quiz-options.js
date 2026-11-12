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

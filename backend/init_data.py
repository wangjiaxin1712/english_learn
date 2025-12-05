"""
初始化数据库，导入示例数据
"""
from database import SessionLocal, init_db
from models import Sentence

# 大学英语六级难度的中英文句子示例（CET6）
CET6_SENTENCES = [
    {"chinese": "随着科技的快速发展，人工智能正在改变我们的生活方式。", "english": "With the rapid development of technology, artificial intelligence is changing our way of life."},
    {"chinese": "环境保护已成为全球关注的焦点问题。", "english": "Environmental protection has become a global focus of concern."},
    {"chinese": "教育是促进社会进步和个人发展的重要途径。", "english": "Education is an important way to promote social progress and personal development."},
    {"chinese": "文化交流有助于增进不同国家之间的理解和友谊。", "english": "Cultural exchange helps to enhance understanding and friendship between different countries."},
    {"chinese": "经济发展必须与环境保护相协调。", "english": "Economic development must be coordinated with environmental protection."},
    {"chinese": "互联网的普及极大地改变了人们获取信息的方式。", "english": "The popularity of the Internet has greatly changed the way people access information."},
    {"chinese": "科学研究需要严谨的态度和创新的思维。", "english": "Scientific research requires a rigorous attitude and innovative thinking."},
    {"chinese": "健康的生活方式包括均衡饮食和适量运动。", "english": "A healthy lifestyle includes a balanced diet and moderate exercise."},
    {"chinese": "全球化趋势使得国际合作变得更加重要。", "english": "The trend of globalization makes international cooperation more important."},
    {"chinese": "阅读是获取知识和提高素养的有效方法。", "english": "Reading is an effective way to acquire knowledge and improve literacy."},
    {"chinese": "创新是推动社会发展的关键动力。", "english": "Innovation is a key driving force for social development."},
    {"chinese": "良好的沟通技巧对于建立人际关系至关重要。", "english": "Good communication skills are essential for building interpersonal relationships."},
    {"chinese": "时间管理是提高工作效率的重要技能。", "english": "Time management is an important skill for improving work efficiency."},
    {"chinese": "可持续发展要求我们在满足当前需求的同时考虑未来。", "english": "Sustainable development requires us to consider the future while meeting current needs."},
    {"chinese": "团队合作能够发挥集体的智慧和力量。", "english": "Teamwork can bring out the collective wisdom and strength."},
    {"chinese": "学习外语有助于拓宽视野和增强竞争力。", "english": "Learning foreign languages helps to broaden horizons and enhance competitiveness."},
    {"chinese": "心理健康与身体健康同样重要。", "english": "Mental health is as important as physical health."},
    {"chinese": "科技进步为人类生活带来了便利，但也带来了挑战。", "english": "Technological progress has brought convenience to human life, but also challenges."},
    {"chinese": "批判性思维是现代社会公民应具备的重要能力。", "english": "Critical thinking is an important ability that citizens in modern society should possess."},
    {"chinese": "文化多样性丰富了人类文明的内涵。", "english": "Cultural diversity enriches the connotation of human civilization."},
    {"chinese": "终身学习已成为适应快速变化社会的必要选择。", "english": "Lifelong learning has become a necessary choice to adapt to a rapidly changing society."},
    {"chinese": "社会责任意识是每个公民应具备的基本素质。", "english": "A sense of social responsibility is a basic quality that every citizen should possess."},
    {"chinese": "创业精神鼓励人们勇于创新和承担风险。", "english": "Entrepreneurship encourages people to innovate and take risks."},
    {"chinese": "数字化时代要求我们掌握新的技能和知识。", "english": "The digital age requires us to master new skills and knowledge."},
    {"chinese": "环境保护需要每个人的参与和努力。", "english": "Environmental protection requires the participation and efforts of everyone."},
    {"chinese": "教育公平是社会公平的重要体现。", "english": "Educational equity is an important manifestation of social equity."},
    {"chinese": "科技创新是推动经济增长的重要引擎。", "english": "Scientific and technological innovation is an important engine for economic growth."},
    {"chinese": "跨文化交流有助于消除误解和偏见。", "english": "Cross-cultural communication helps to eliminate misunderstandings and prejudices."},
    {"chinese": "个人成长需要不断挑战自我和突破局限。", "english": "Personal growth requires constantly challenging oneself and breaking through limitations."},
    {"chinese": "社会责任感促使我们关注弱势群体的需求。", "english": "A sense of social responsibility prompts us to pay attention to the needs of vulnerable groups."},
    {"chinese": "信息时代要求我们具备筛选和判断信息的能力。", "english": "The information age requires us to have the ability to filter and judge information."},
    {"chinese": "合作共赢是国际关系发展的正确方向。", "english": "Win-win cooperation is the right direction for the development of international relations."},
    {"chinese": "文化传承需要与时俱进，不断创新。", "english": "Cultural inheritance needs to keep pace with the times and constantly innovate."},
    {"chinese": "健康的生活方式可以预防许多疾病。", "english": "A healthy lifestyle can prevent many diseases."},
    {"chinese": "知识经济时代，人才是最宝贵的资源。", "english": "In the era of knowledge economy, talent is the most valuable resource."},
    {"chinese": "环境保护与经济发展并不矛盾，可以协调发展。", "english": "Environmental protection and economic development are not contradictory and can develop in a coordinated manner."},
    {"chinese": "学习能力比知识本身更为重要。", "english": "Learning ability is more important than knowledge itself."},
    {"chinese": "创新思维需要打破传统观念的束缚。", "english": "Innovative thinking requires breaking free from the constraints of traditional concepts."},
    {"chinese": "全球化背景下，跨文化理解能力日益重要。", "english": "In the context of globalization, cross-cultural understanding is increasingly important."},
    {"chinese": "可持续发展理念已深入人心。", "english": "The concept of sustainable development has been deeply rooted in people's hearts."},
    {"chinese": "教育的目标不仅是传授知识，更要培养能力。", "english": "The goal of education is not only to impart knowledge, but also to cultivate abilities."},
    {"chinese": "科技进步改变了人们的工作方式和生活方式。", "english": "Scientific and technological progress has changed people's working and living styles."},
    {"chinese": "文化自信是一个国家、一个民族发展的重要支撑。", "english": "Cultural confidence is an important support for the development of a country and a nation."},
    {"chinese": "终身学习理念适应了知识快速更新的时代特征。", "english": "The concept of lifelong learning adapts to the characteristics of the era of rapid knowledge updates."},
    {"chinese": "环境保护需要全球各国共同努力。", "english": "Environmental protection requires joint efforts from all countries around the world."},
    {"chinese": "创新是引领发展的第一动力。", "english": "Innovation is the primary driving force for development."},
    {"chinese": "教育公平是社会公平的基础。", "english": "Educational equity is the foundation of social equity."},
    {"chinese": "文化多样性是人类文明进步的重要动力。", "english": "Cultural diversity is an important driving force for the progress of human civilization."},
    {"chinese": "健康的生活方式包括合理饮食、适量运动和充足睡眠。", "english": "A healthy lifestyle includes a reasonable diet, moderate exercise and adequate sleep."},
    {"chinese": "全球化促进了各国之间的经济和文化交流。", "english": "Globalization has promoted economic and cultural exchanges between countries."},
]

# 大学英语四级难度的中英文句子示例（CET4）
CET4_SENTENCES = [
    {"chinese": "我喜欢在周末和朋友一起看电影。", "english": "I like to watch movies with friends on weekends."},
    {"chinese": "这个图书馆有很多有用的书籍。", "english": "This library has many useful books."},
    {"chinese": "学生们应该认真完成作业。", "english": "Students should complete their homework carefully."},
    {"chinese": "天气好的时候，我喜欢去公园散步。", "english": "When the weather is nice, I like to take a walk in the park."},
    {"chinese": "学习英语需要每天坚持练习。", "english": "Learning English requires daily practice."},
    {"chinese": "我的朋友来自不同的国家。", "english": "My friends come from different countries."},
    {"chinese": "这家餐厅的食物非常美味。", "english": "The food in this restaurant is very delicious."},
    {"chinese": "我计划下个月去北京旅游。", "english": "I plan to travel to Beijing next month."},
    {"chinese": "阅读可以帮助我们扩大知识面。", "english": "Reading can help us expand our knowledge."},
    {"chinese": "运动对保持健康很重要。", "english": "Exercise is important for staying healthy."},
    {"chinese": "我们应该尊重老师和同学。", "english": "We should respect teachers and classmates."},
    {"chinese": "这个城市有很多美丽的景点。", "english": "This city has many beautiful attractions."},
    {"chinese": "我喜欢听音乐来放松心情。", "english": "I like to listen to music to relax."},
    {"chinese": "大学生活充满了新的挑战和机会。", "english": "College life is full of new challenges and opportunities."},
    {"chinese": "我们应该保护环境，减少污染。", "english": "We should protect the environment and reduce pollution."},
    {"chinese": "这个项目需要团队合作才能完成。", "english": "This project requires teamwork to complete."},
    {"chinese": "我每天花两个小时学习英语。", "english": "I spend two hours learning English every day."},
    {"chinese": "互联网让我们的生活更加便利。", "english": "The Internet makes our lives more convenient."},
    {"chinese": "我们应该学会管理自己的时间。", "english": "We should learn to manage our time."},
    {"chinese": "这个学校有很好的教学设施。", "english": "This school has excellent teaching facilities."},
    {"chinese": "我喜欢和同学一起讨论问题。", "english": "I like to discuss problems with classmates."},
    {"chinese": "健康饮食对我们的身体很重要。", "english": "A healthy diet is important for our body."},
    {"chinese": "我们应该培养良好的学习习惯。", "english": "We should develop good study habits."},
    {"chinese": "这个活动吸引了很多人参加。", "english": "This activity attracted many people to participate."},
    {"chinese": "我喜欢在早晨做运动。", "english": "I like to exercise in the morning."},
    {"chinese": "我们应该珍惜时间，努力学习。", "english": "We should cherish time and study hard."},
    {"chinese": "这个博物馆展示了丰富的历史文化。", "english": "This museum displays rich historical culture."},
    {"chinese": "我喜欢参加各种课外活动。", "english": "I like to participate in various extracurricular activities."},
    {"chinese": "我们应该学会独立思考和解决问题。", "english": "We should learn to think independently and solve problems."},
    {"chinese": "这个城市交通便利，生活舒适。", "english": "This city has convenient transportation and comfortable living."},
    {"chinese": "我喜欢阅读不同类型的书籍。", "english": "I like to read different types of books."},
    {"chinese": "我们应该关心和帮助他人。", "english": "We should care about and help others."},
    {"chinese": "这个公园是休闲放松的好地方。", "english": "This park is a good place for relaxation."},
    {"chinese": "我喜欢学习新的知识和技能。", "english": "I like to learn new knowledge and skills."},
    {"chinese": "我们应该保持积极乐观的态度。", "english": "We should maintain a positive and optimistic attitude."},
    {"chinese": "这个图书馆提供安静的学习环境。", "english": "This library provides a quiet study environment."},
    {"chinese": "我喜欢和朋友们一起分享快乐。", "english": "I like to share happiness with my friends."},
    {"chinese": "我们应该制定合理的学习计划。", "english": "We should make a reasonable study plan."},
    {"chinese": "这个活动有助于提高我们的能力。", "english": "This activity helps to improve our abilities."},
    {"chinese": "我喜欢在空闲时间听音乐。", "english": "I like to listen to music in my spare time."},
    {"chinese": "我们应该学会与他人友好相处。", "english": "We should learn to get along well with others."},
    {"chinese": "这个学校为学生提供了很多机会。", "english": "This school provides many opportunities for students."},
    {"chinese": "我喜欢参加志愿者活动。", "english": "I like to participate in volunteer activities."},
    {"chinese": "我们应该培养自己的兴趣爱好。", "english": "We should develop our hobbies and interests."},
    {"chinese": "这个城市有很多优秀的大学。", "english": "This city has many excellent universities."},
    {"chinese": "我喜欢在周末和家人一起度过时光。", "english": "I like to spend time with my family on weekends."},
    {"chinese": "我们应该学会从错误中学习。", "english": "We should learn from our mistakes."},
    {"chinese": "这个活动增进了同学之间的友谊。", "english": "This activity enhanced the friendship among classmates."},
    {"chinese": "我喜欢尝试新的事物和挑战。", "english": "I like to try new things and challenges."},
    {"chinese": "我们应该为自己的未来做好准备。", "english": "We should prepare for our future."},
]

# 雅思难度的中英文句子示例（IELTS）
IELTS_SENTENCES = [
    {"chinese": "全球化对发展中国家的经济产生了深远的影响。", "english": "Globalization has had a profound impact on the economies of developing countries."},
    {"chinese": "现代科技的发展引发了关于隐私保护的伦理争议。", "english": "The development of modern technology has sparked ethical debates about privacy protection."},
    {"chinese": "气候变化是当今世界面临的最紧迫的环境挑战之一。", "english": "Climate change is one of the most urgent environmental challenges facing the world today."},
    {"chinese": "高等教育机构在培养创新人才方面发挥着关键作用。", "english": "Higher education institutions play a crucial role in cultivating innovative talents."},
    {"chinese": "多元文化社会需要建立有效的跨文化沟通机制。", "english": "Multicultural societies require effective mechanisms for cross-cultural communication."},
    {"chinese": "可持续城市发展需要在经济增长与环境保护之间取得平衡。", "english": "Sustainable urban development requires a balance between economic growth and environmental protection."},
    {"chinese": "人工智能技术的应用正在重塑传统行业的运作模式。", "english": "The application of artificial intelligence technology is reshaping the operational models of traditional industries."},
    {"chinese": "社会媒体平台改变了人们获取信息和交流的方式。", "english": "Social media platforms have transformed the way people access information and communicate."},
    {"chinese": "教育公平是实现社会平等的重要途径。", "english": "Educational equity is an important pathway to achieving social equality."},
    {"chinese": "生物多样性保护对于维持生态系统的稳定性至关重要。", "english": "Biodiversity conservation is crucial for maintaining ecosystem stability."},
    {"chinese": "远程工作的普及对传统办公模式提出了新的挑战。", "english": "The widespread adoption of remote work has presented new challenges to traditional office models."},
    {"chinese": "文化遗产的保护需要政府、社区和国际组织的共同努力。", "english": "The protection of cultural heritage requires joint efforts from governments, communities, and international organizations."},
    {"chinese": "人口老龄化趋势要求社会重新审视养老保障体系。", "english": "The trend of population aging requires society to reconsider the elderly care system."},
    {"chinese": "可再生能源技术的发展为应对能源危机提供了新的解决方案。", "english": "The development of renewable energy technologies provides new solutions to address the energy crisis."},
    {"chinese": "国际移民现象反映了全球化背景下人口流动的复杂性。", "english": "International migration reflects the complexity of population mobility in the context of globalization."},
    {"chinese": "数字鸿沟问题阻碍了信息时代的社会包容性发展。", "english": "The digital divide hinders inclusive social development in the information age."},
    {"chinese": "公共卫生系统的完善对于应对突发疫情至关重要。", "english": "The improvement of public health systems is essential for responding to sudden epidemics."},
    {"chinese": "性别平等议题在当代社会仍然具有重要的现实意义。", "english": "Gender equality issues remain highly relevant in contemporary society."},
    {"chinese": "科技创新与伦理规范的平衡是科技发展面临的重要课题。", "english": "Balancing technological innovation with ethical standards is an important issue in technological development."},
    {"chinese": "城市交通拥堵问题需要综合性的解决方案。", "english": "Urban traffic congestion requires comprehensive solutions."},
    {"chinese": "心理健康问题在现代社会日益受到关注。", "english": "Mental health issues are receiving increasing attention in modern society."},
    {"chinese": "食品安全监管体系的建立保障了消费者的权益。", "english": "The establishment of food safety regulatory systems protects consumer rights."},
    {"chinese": "知识产权的保护促进了创新活动的持续发展。", "english": "The protection of intellectual property promotes the continuous development of innovation."},
    {"chinese": "水资源管理是可持续发展战略的重要组成部分。", "english": "Water resource management is an important component of sustainable development strategies."},
    {"chinese": "国际合作的加强有助于应对全球性挑战。", "english": "Strengthening international cooperation helps address global challenges."},
    {"chinese": "教育技术的应用正在改变传统的教学模式。", "english": "The application of educational technology is transforming traditional teaching models."},
    {"chinese": "社会信用体系的建设需要平衡效率与隐私保护。", "english": "The construction of social credit systems requires balancing efficiency with privacy protection."},
    {"chinese": "职业培训项目有助于提高劳动力的就业竞争力。", "english": "Vocational training programs help enhance the employment competitiveness of the workforce."},
    {"chinese": "城市规划需要考虑环境可持续性和居民生活质量。", "english": "Urban planning needs to consider environmental sustainability and residents' quality of life."},
    {"chinese": "国际旅游业的繁荣促进了不同文化之间的交流与理解。", "english": "The prosperity of the international tourism industry promotes cultural exchange and understanding."},
    {"chinese": "数据隐私保护法规的制定反映了对个人信息安全的重视。", "english": "The formulation of data privacy protection regulations reflects the importance attached to personal information security."},
    {"chinese": "创业生态系统的发展为创新型企业提供了良好的成长环境。", "english": "The development of entrepreneurial ecosystems provides a favorable growth environment for innovative enterprises."},
    {"chinese": "社会公益事业的发展体现了社会的文明进步。", "english": "The development of social welfare undertakings reflects the progress of social civilization."},
    {"chinese": "国际教育交流项目拓宽了学生的国际视野。", "english": "International educational exchange programs broaden students' international perspectives."},
    {"chinese": "循环经济模式的推广有助于减少资源浪费。", "english": "The promotion of circular economy models helps reduce resource waste."},
    {"chinese": "网络安全的维护需要技术手段与法律规范相结合。", "english": "Maintaining cybersecurity requires a combination of technical means and legal regulations."},
    {"chinese": "老龄化社会的到来要求调整现有的社会保障政策。", "english": "The arrival of an aging society requires adjustments to existing social security policies."},
    {"chinese": "绿色建筑技术的应用推动了建筑行业的可持续发展。", "english": "The application of green building technology promotes sustainable development in the construction industry."},
    {"chinese": "国际金融市场的波动对全球经济产生重要影响。", "english": "Fluctuations in international financial markets have significant impacts on the global economy."},
    {"chinese": "社会创新项目的实施需要多方利益相关者的参与。", "english": "The implementation of social innovation projects requires participation from multiple stakeholders."},
    {"chinese": "数字经济的兴起改变了传统的商业模式。", "english": "The rise of the digital economy has transformed traditional business models."},
    {"chinese": "环境保护与经济发展的协调需要政策创新。", "english": "Coordinating environmental protection with economic development requires policy innovation."},
    {"chinese": "国际人才流动促进了知识和技术的跨国传播。", "english": "International talent mobility promotes the cross-border transmission of knowledge and technology."},
    {"chinese": "社会包容性政策的实施有助于减少社会不平等。", "english": "The implementation of inclusive social policies helps reduce social inequality."},
    {"chinese": "科技创新政策的制定需要考虑长期发展战略。", "english": "The formulation of technological innovation policies needs to consider long-term development strategies."},
    {"chinese": "国际组织在解决全球性问题方面发挥着重要作用。", "english": "International organizations play an important role in addressing global issues."},
    {"chinese": "社会媒体的影响力要求建立相应的监管机制。", "english": "The influence of social media requires the establishment of corresponding regulatory mechanisms."},
    {"chinese": "知识经济的特征要求教育体系进行相应的改革。", "english": "The characteristics of the knowledge economy require corresponding reforms in the education system."},
    {"chinese": "国际合作的深化有助于构建人类命运共同体。", "english": "The deepening of international cooperation helps build a community with a shared future for humanity."},
    {"chinese": "可持续发展目标的实现需要全球各国的共同努力。", "english": "Achieving sustainable development goals requires joint efforts from all countries worldwide."},
]

def init_sample_data():
    """初始化示例数据"""
    init_db()
    db = SessionLocal()
    
    try:
        # 检查是否已有数据
        count = db.query(Sentence).count()
        if count > 0:
            print(f"数据库中已有 {count} 条记录，跳过初始化")
            return
        
        # 插入六级句子
        for item in CET6_SENTENCES:
            sentence = Sentence(
                chinese=item['chinese'],
                english=item['english'],
                difficulty='cet6'
            )
            db.add(sentence)
        
        # 插入四级句子
        for item in CET4_SENTENCES:
            sentence = Sentence(
                chinese=item['chinese'],
                english=item['english'],
                difficulty='cet4'
            )
            db.add(sentence)
        
        # 插入雅思句子
        for item in IELTS_SENTENCES:
            sentence = Sentence(
                chinese=item['chinese'],
                english=item['english'],
                difficulty='ielts'
            )
            db.add(sentence)
        
        db.commit()
        total = len(CET6_SENTENCES) + len(CET4_SENTENCES) + len(IELTS_SENTENCES)
        print(f"成功导入数据：")
        print(f"  - CET6 (六级): {len(CET6_SENTENCES)} 条")
        print(f"  - CET4 (四级): {len(CET4_SENTENCES)} 条")
        print(f"  - IELTS (雅思): {len(IELTS_SENTENCES)} 条")
        print(f"总计: {total} 条")
    except Exception as e:
        db.rollback()
        print(f"导入数据时出错: {e}")
    finally:
        db.close()

if __name__ == '__main__':
    init_sample_data()


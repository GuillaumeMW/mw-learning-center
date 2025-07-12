-- Add sample lessons for Level 1 course
INSERT INTO public.lessons (course_id, title, content, order_index, duration_minutes) 
SELECT 
  c.id,
  lesson_data.title,
  lesson_data.content,
  lesson_data.order_index,
  lesson_data.duration_minutes
FROM public.courses c
CROSS JOIN (
  VALUES 
    ('Introduction to Relocation Services', 
     '# Welcome to MovingWaldo Relocation Specialist Level 1

## Course Overview
Welcome to your journey as a MovingWaldo Relocation Specialist! This comprehensive course will teach you the fundamentals of helping clients navigate the complex world of relocation.

## What You''ll Learn
- Understanding client needs and pain points
- Basic relocation timeline planning
- Essential documentation and paperwork
- Communication best practices
- MovingWaldo platform fundamentals

## Learning Objectives
By the end of this lesson, you will be able to:
1. Identify the key challenges people face when relocating
2. Explain the MovingWaldo approach to relocation assistance
3. Understand your role as a relocation specialist

## Introduction Video
*[Video content would go here]*

## Key Concepts

### What is Relocation?
Relocation is more than just moving from one place to another. It involves:
- **Physical moving** of belongings
- **Administrative tasks** like address changes
- **Emotional support** during a stressful time
- **Local knowledge** about the new area

### The MovingWaldo Difference
MovingWaldo specializes in making relocation seamless by:
- Providing comprehensive checklists
- Connecting clients with trusted service providers
- Offering personalized guidance throughout the process
- Using technology to streamline complex tasks

## Next Steps
Complete the quiz below to test your understanding before moving to the next lesson.', 
     1, 15),
    
    ('Understanding Client Needs', 
     '# Understanding Client Needs

## Learning Objectives
- Identify different types of relocation clients
- Learn active listening techniques
- Understand common relocation challenges
- Practice needs assessment strategies

## Types of Relocation Clients

### Corporate Relocations
- Employees moving for work
- Often have company support
- Timeline pressures
- Family considerations

### Personal Relocations
- Life changes (marriage, retirement, etc.)
- More flexibility in timing
- Budget consciousness
- Emotional attachment considerations

### International Relocations
- Complex documentation requirements
- Cultural adaptation needs
- Currency and financial considerations
- Legal and visa requirements

## Active Listening Techniques

### The LISTEN Method
- **L**ook interested and maintain eye contact
- **I**nquire with open-ended questions
- **S**ummarize what you''ve heard
- **T**ake notes on important details
- **E**mpathize with their situation
- **N**avigate toward solutions

## Common Pain Points
1. **Overwhelm** - Too many tasks to manage
2. **Time constraints** - Busy schedules
3. **Unfamiliarity** - Don''t know the new area
4. **Trust issues** - Concern about service providers
5. **Budget uncertainty** - Unknown costs

## Assessment Questions
During your initial consultation, always ask:
- What''s driving this move?
- What''s your ideal timeline?
- What are your biggest concerns?
- Have you relocated before?
- What''s most important to you in this process?

## Practice Exercise
Role-play with a colleague using the provided scenarios to practice needs assessment techniques.', 
     2, 20),
    
    ('Creating Relocation Timelines', 
     '# Creating Relocation Timelines

## Learning Objectives
- Master the standard relocation timeline
- Learn to customize timelines for different situations
- Understand critical milestones and deadlines
- Practice timeline creation tools

## Standard 8-Week Timeline

### Week 8 (8 weeks before move)
- Initial planning and budgeting
- Research new location
- School research (if applicable)
- Initial MovingWaldo account setup

### Week 6-7 (6-7 weeks before)
- Obtain moving quotes
- Book moving company
- Start decluttering process
- Begin school transfer process

### Week 4-5 (4-5 weeks before)
- Submit address change notifications
- Transfer or close utility accounts
- Update insurance policies
- Plan travel arrangements

### Week 2-3 (2-3 weeks before)
- Confirm all bookings
- Pack non-essential items
- Arrange child/pet care for moving day
- Create moving day timeline

### Week 1 (1 week before)
- Final packing
- Confirm logistics with all parties
- Prepare moving day essentials box
- Complete final preparations

### Moving Day
- Coordinate with moving team
- Conduct final walk-through
- Ensure all documentation is ready
- Oversee loading process

### First Week After Move
- Unpack essentials
- Register to vote
- Update driver''s license
- Find local services (doctor, dentist, etc.)

## Customization Factors

### Rush Moves (2-4 weeks)
- Prioritize critical tasks
- Use premium services when necessary
- Focus on essentials first
- Plan for higher costs

### Leisurely Moves (12+ weeks)
- More time for research and planning
- Opportunities for cost savings
- Gradual decluttering process
- Multiple quote comparisons

### International Moves
- Add 4-6 weeks for documentation
- Consider visa processing time
- Factor in shipping delays
- Plan for cultural orientation

## Timeline Tools
- MovingWaldo Timeline Generator
- Customizable checklists
- Milestone tracking
- Progress sharing with clients

## Best Practices
1. Always build in buffer time
2. Identify potential bottlenecks early
3. Communicate timeline clearly to clients
4. Regular check-ins and updates
5. Flexibility for unexpected changes

## Assignment
Create a timeline for the provided case study using MovingWaldo tools.', 
     3, 25),
    
    ('Essential Documentation', 
     '# Essential Documentation

## Learning Objectives
- Master the complete documentation checklist
- Understand legal requirements for different move types
- Learn document organization strategies
- Practice documentation guidance techniques

## Core Documentation Categories

### Identity and Legal Documents
- Birth certificates
- Passports and driver''s licenses
- Social Security cards
- Marriage/divorce certificates
- Military discharge papers
- Immigration documents

### Financial Documents
- Bank statements (last 3 months)
- Tax returns (last 2 years)
- Investment account statements
- Credit reports
- Insurance policies
- Employment verification letters

### Property Documents
- Lease agreements or mortgage documents
- Property deeds
- Home inspection reports
- Utility bills for address verification
- HOA documents

### Medical Records
- Complete medical histories
- Prescription lists
- Insurance cards
- Vaccination records
- Emergency contacts

### Educational Records
- Transcripts and diplomas
- School records for children
- Professional certifications
- Training certificates

## Organization Strategies

### The Three-Folder System
1. **Immediate Access** - Documents needed within 30 days
2. **Short-term Storage** - Documents needed within 6 months
3. **Long-term Archive** - Historical documents for reference

### Digital Organization
- Scan all important documents
- Use cloud storage with backup
- Password-protected files
- Organized folder structure
- Multiple access points

## Legal Considerations

### State-to-State Moves
- Driver''s license requirements (typically 30 days)
- Vehicle registration deadlines
- Voter registration updates
- Professional license transfers

### International Moves
- Visa and work permit requirements
- Apostilled documents
- Translated certificates
- Educational credential evaluation
- Medical documentation requirements

## MovingWaldo Documentation Services
- Document checklist generator
- Deadline tracking system
- Secure document storage
- Professional translation services
- Legal requirement updates by location

## Common Mistakes to Avoid
1. Waiting until the last minute
2. Not making copies
3. Forgetting expiration dates
4. Inadequate organization
5. Not researching destination requirements

## Client Guidance Tips
- Start early (8+ weeks before move)
- Create both physical and digital copies
- Use a dedicated moving folder
- Keep originals with you during travel
- Verify requirements for new location

## Practical Exercise
Using the provided client scenario, create a complete documentation checklist with deadlines and priorities.', 
     4, 30),
    
    ('Communication Best Practices', 
     '# Communication Best Practices

## Learning Objectives
- Develop professional communication skills
- Master different communication channels
- Learn conflict resolution techniques
- Practice client update strategies

## Communication Fundamentals

### The 3 C''s of Professional Communication
1. **Clear** - Easy to understand language
2. **Concise** - Respectful of time
3. **Consistent** - Regular and reliable updates

### Building Rapport
- Use client''s preferred communication style
- Mirror their level of formality
- Show genuine interest in their success
- Remember personal details they share
- Be empathetic to their stress levels

## Communication Channels

### Email Communication
**Best for:**
- Detailed information sharing
- Document delivery
- Timeline updates
- Reference materials

**Best Practices:**
- Clear subject lines
- Bullet points for easy scanning
- Professional signature
- Timely responses (within 24 hours)

### Phone Communication
**Best for:**
- Complex discussions
- Emotional support
- Urgent matters
- Building personal connection

**Best Practices:**
- Scheduled call times
- Agenda preparation
- Note-taking during calls
- Follow-up email summaries

### Text/SMS Communication
**Best for:**
- Quick updates
- Appointment reminders
- Time-sensitive notifications
- Simple confirmations

**Best Practices:**
- Professional tone
- Clear identification
- Appropriate timing
- Not for sensitive information

### Video Calls
**Best for:**
- Initial consultations
- Complex explanations
- Document reviews
- Building trust

## Managing Difficult Conversations

### The CALM Method
- **C**larify the issue
- **A**cknowledge their feelings
- **L**isten actively
- **M**ove toward solutions

### Common Scenarios
1. **Cost overruns**
2. **Timeline delays**
3. **Service provider issues**
4. **Documentation problems**
5. **Stress and overwhelm**

## Client Update Strategy

### Weekly Check-ins
- Progress on current tasks
- Upcoming deadlines
- Any issues or concerns
- Next week''s priorities

### Milestone Updates
- Major task completions
- Timeline adjustments
- Budget updates
- Success celebrations

### Crisis Communication
- Immediate notification
- Clear explanation of issue
- Proposed solutions
- Next steps and timeline

## Documentation and Follow-up
- Keep records of all communications
- Summarize important phone calls
- Track promises and commitments
- Regular relationship health checks

## Cultural Sensitivity
- Be aware of different communication styles
- Respect cultural holidays and customs
- Understand varying levels of directness
- Consider language barriers

## Technology Tools
- MovingWaldo communication portal
- Automated update systems
- Document sharing platforms
- Progress tracking dashboards

## Assessment Activity
Practice scenarios covering various communication challenges and solutions using role-play exercises.', 
     5, 35)
) AS lesson_data(title, content, order_index, duration_minutes)
WHERE c.level = 1;
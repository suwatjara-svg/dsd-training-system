import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial data...');

  // 1. Create Superadmin & Officer
  const adminPasswordHash = await bcrypt.hash('AdminPassword2026!', 10);
  const admin = await prisma.admin.upsert({
    where: { email: 'admin@gov.th' },
    update: {},
    create: {
      email: 'admin@gov.th',
      fullName: 'อาจารย์สุวัฒน์ (หัวหน้างานคัดเลือก)',
      passwordHash: adminPasswordHash,
      role: 'SUPER_ADMIN',
    },
  });

  const officer = await prisma.admin.upsert({
    where: { email: 'officer@gov.th' },
    update: {},
    create: {
      email: 'officer@gov.th',
      fullName: 'เจ้าหน้าที่สมชาย ประจำฝ่ายฝึกอบรม',
      passwordHash: adminPasswordHash,
      role: 'OFFICER',
    },
  });

  console.log('Admins created:', admin.email, officer.email);

  // 2. Create Form Templates
  const templateBakery = await prisma.formTemplate.create({
    data: {
      name: 'แบบฟอร์มอาหารและเบเกอรี่',
      category: 'อาหารและเบเกอรี่',
      description: 'เทมเพลตมาตรฐานสำหรับรับสมัครฝึกอบรมหลักสูตรทำอาหาร ขนม และเบเกอรี่',
      schemaJson: JSON.stringify([
        {
          title: 'ข้อมูลพื้นฐานและประสบการณ์ทำอาหาร',
          questions: [
            { label: 'เคยมีประสบการณ์ทำเบเกอรี่หรือขนมหรือไม่?', type: 'RADIO', options: ['ไม่เคยมีประสบการณ์ (เริ่มต้นจากศูนย์)', 'เคยทำรับประทานเองในครอบครัว', 'เคยทำขายเป็นอาชีพเสริม', 'เปิดร้าน/ประกอบอาชีพอยู่แล้ว'], required: true },
            { label: 'วัตถุประสงค์ในการเข้าฝึกอบรม', type: 'DROPDOWN', options: ['ต้องการนำไปประกอบอาชีพหลัก', 'ต้องการต่อยอดเปิดร้านเบเกอรี่', 'ต้องการเพิ่มทักษะสร้างรายได้เสริม', 'งานอดิเรก'], required: true },
            { label: 'แพ้อาหารประเภทแป้ง นม หรือไข่หรือไม่?', type: 'TEXT', required: false },
          ]
        }
      ])
    }
  });

  const templateElectrical = await prisma.formTemplate.create({
    data: {
      name: 'แบบฟอร์มช่างไฟฟ้าและอิเล็กทรอนิกส์',
      category: 'ช่างไฟฟ้า',
      description: 'เทมเพลตสำหรับหลักสูตรติดตั้งไฟฟ้าภายในอาคารและเครื่องใช้ไฟฟ้า',
      schemaJson: JSON.stringify([
        {
          title: 'พื้นฐานความรู้ด้านช่างไฟฟ้า',
          questions: [
            { label: 'มีใบรับรองความรู้ความสามารถ (License) ช่างไฟฟ้าหรือไม่?', type: 'RADIO', options: ['ยังไม่มี', 'มี (ระดับ 1)', 'มี (ระดับ 2)'], required: true },
            { label: 'มีประวัติอาการตาบอดสีหรือไม่?', type: 'RADIO', options: ['ไม่มี', 'มี'], required: true }
          ]
        }
      ])
    }
  });

  // 3. Create Demo Course: การทำเบเกอรี่มืออาชีพ (Capacity: 20)
  const course = await prisma.course.create({
    data: {
      code: 'BAKERY-2026-01',
      title: 'หลักสูตรการทำเบเกอรี่และขนมอบเชิงพาณิชย์',
      description: 'อบรมเชิงปฏิบัติการเข้มข้น 30 ชั่วโมง เรียนรู้เทคนิคการทำขนมปัง ครัวซองต์ เค้ก และการคำนวณต้นทุนเปิดร้าน พร้อมรับวุฒิบัตรรับรอง',
      capacity: 20,
      department: 'กลุ่มงานพัฒนาฝีมือแรงงานและส่งเสริมอาชีพ',
      responsiblePerson: 'อาจารย์สุวัฒน์',
      status: 'OPEN',
      targetAudience: 'ประชาชนทั่วไป อายุ 18 ปีขึ้นไป ที่สนใจประกอบอาชีพทำเบเกอรี่',
      qualifications: 'สัญชาติไทย อายุ 18-55 ปี ไม่เป็นโรคติดต่อร้ายแรง สามารถเข้าอบรมได้ครบตามกำหนด',
      startDate: new Date('2026-11-01'),
      endDate: new Date('2026-11-05'),
      timeSlot: '09:00 - 16:00 น.',
      location: 'ห้องปฏิบัติการเบเกอรี่ อาคารฝึกอบรม 3',
      requiredDocuments: {
        create: [
          { title: 'สำเนาบัตรประชาชน (พร้อมเซ็นรับรองสำเนาถูกต้อง)', isRequired: true },
          { title: 'รูปถ่ายหน้าตรง 1-2 นิ้ว', isRequired: true },
          { title: 'สำเนาวุฒิการศึกษา', isRequired: false },
        ]
      }
    }
  });

  // Create Form for this Course
  const courseForm = await prisma.form.create({
    data: {
      courseId: course.id,
      title: 'ใบสมัครเข้ารับการฝึกอบรม: การทำเบเกอรี่และขนมอบเชิงพาณิชย์',
      description: 'กรุณากรอกข้อมูลตามความเป็นจริงเพื่อประกอบการตรวจคุณสมบัติและคัดเลือกผู้เข้าฝึกอบรม',
      version: 1,
      sections: {
        create: [
          {
            title: 'ข้อมูลความพร้อมและประสบการณ์',
            orderIndex: 1,
            questions: {
              create: [
                {
                  label: 'ประสบการณ์การทำอาหารหรือเบเกอรี่',
                  questionType: 'RADIO',
                  isRequired: true,
                  optionsJson: JSON.stringify(['ไม่เคยมีประสบการณ์เลย', 'เคยทำทานเองในครอบครัว', 'เคยทำจำหน่ายเล็กน้อย', 'มีร้านอยู่แล้วต้องการเพิ่มเมนู']),
                  orderIndex: 1,
                },
                {
                  label: 'เป้าหมายหลังจบการฝึกอบรม',
                  questionType: 'DROPDOWN',
                  isRequired: true,
                  optionsJson: JSON.stringify(['เปิดร้านเบเกอรี่ของตนเอง', 'ทำขายออนไลน์เป็นอาชีพเสริม', 'สมัครงานตำแหน่งพนักงานเบเกอรี่', 'ทำรับประทานเอง']),
                  orderIndex: 2,
                },
                {
                  label: 'สามารถเข้าเรียนได้ครบตามวันเวลาที่กำหนด (5 วันเต็ม) หรือไม่?',
                  questionType: 'RADIO',
                  isRequired: true,
                  optionsJson: JSON.stringify(['สามารถเข้าเรียนได้ครบทุกวัน', 'อาจติดธุระบางวัน']),
                  orderIndex: 3,
                }
              ]
            }
          }
        ]
      }
    }
  });

  console.log(`Course created: ${course.title} (ID: ${course.id})`);

  // 4. Generate Applicants (รวม 400 คนตาม Requirement จริง เพื่อทดสอบ Screening Engine ได้ทันที)
  console.log('Generating 400 realistic applicants for screening simulation...');

  const firstNames = [
    'สมชาย', 'วิภา', 'กิตติ', 'นภา', 'ธนพล', 'สุภาพร', 'อนุชา', 'พิมพา', 'ชาญชัย', 'วรรณา',
    'ศิริพร', 'ประเสริฐ', 'ดวงใจ', 'ธีรเดช', 'มณีรัตน์', 'ณัฐวุฒิ', 'กานดา', 'ปิยะ', 'รัตนา', 'อภิสิทธิ์',
    'จันทรา', 'ชัยวัฒน์', 'ชลธิชา', 'ทรงพล', 'ทัศนีย์', 'บุญส่ง', 'เบญจมาศ', 'พงศกร', 'พรทิพย์', 'ยุทธนา'
  ];
  const lastNames = [
    'ใจดี', 'รักชาติ', 'เจริญสุข', 'มั่นคง', 'สุขเกษม', 'ทองดี', 'ประสิทธิ์', 'แสงสุวรรณ', 'วงศ์ไทย', 'รุ่งเรือง',
    'สุวรรณโชติ', 'เกียรติขจร', 'มงคลทรัพย์', 'จิตรประภัสร์', 'ศรีสวัสดิ์', 'พงษ์พาณิชย์', 'พิทักษ์ธรรม', 'วัฒนากูล'
  ];
  const occupations = ['พนักงานบริษัทเอกชน', 'รับจ้างทั่วไป', 'ธุรกิจส่วนตัว', 'แม่บ้าน / ว่างงาน', 'นักศึกษาจบใหม่', 'ค้าขาย'];
  const educations = ['มัธยมศึกษาตอนต้น (ม.3)', 'มัธยมศึกษาตอนปลาย (ม.6)', 'ปวช.', 'ปวส.', 'ปริญญาตรี', 'สูงกว่าปริญญาตรี'];

  const applicantsData = [];

  for (let i = 1; i <= 400; i++) {
    const fn = firstNames[i % firstNames.length];
    const ln = lastNames[i % lastNames.length];
    const appNum = `APP-2026-${i.toString().padStart(6, '0')}`;
    const idCard = `1100400${(100000 + i).toString()}`;
    const phone = `08${(10000000 + i * 23).toString().slice(0, 8)}`;
    const age = 18 + (i % 40);
    const occ = occupations[i % occupations.length];
    const edu = educations[i % educations.length];

    // กำหนด Mock สถานะบางส่วนเพื่อให้เห็น Dashboard และ Workflow จำลอง
    let qualStatus = 'PENDING';
    let contactStatus = 'NOT_CONTACTED';
    let interestStatus = 'UNKNOWN';
    let selectionStatus = 'PENDING';
    let waitlistOrder: number | null = null;

    if (i <= 18) {
      // 18 คนแรก: ผ่านคุณสมบัติ + โทรติดต่อแล้ว + ต้องการเรียน + คัดเลือกแล้ว
      qualStatus = 'QUALIFIED';
      contactStatus = 'CONTACTED';
      interestStatus = 'INTERESTED';
      selectionStatus = 'SELECTED';
    } else if (i === 19) {
      // คนที่ 19: ผ่านคุณสมบัติ + โทรแล้ว + ต้องการเรียน (รอคัดเลือก)
      qualStatus = 'QUALIFIED';
      contactStatus = 'CONTACTED';
      interestStatus = 'INTERESTED';
      selectionStatus = 'PENDING';
    } else if (i === 20) {
      // คนที่ 20: ผ่านคุณสมบัติ + โทรแล้ว + ขอคิดดูก่อน
      qualStatus = 'QUALIFIED';
      contactStatus = 'CONTACTED';
      interestStatus = 'UNDECIDED';
      selectionStatus = 'PENDING';
    } else if (i >= 21 && i <= 25) {
      // 5 คน: จัดเป็นตัวสำรอง (Waitlist 1 - 5)
      qualStatus = 'QUALIFIED';
      contactStatus = 'CONTACTED';
      interestStatus = 'INTERESTED';
      selectionStatus = 'WAITLIST';
      waitlistOrder = i - 20;
    } else if (i >= 26 && i <= 35) {
      // ติดต่อไม่ได้
      qualStatus = 'QUALIFIED';
      contactStatus = 'NO_ANSWER';
      interestStatus = 'UNKNOWN';
    } else if (i >= 36 && i <= 45) {
      // ไม่ผ่านคุณสมบัติ
      qualStatus = 'NOT_QUALIFIED';
      selectionStatus = 'REJECTED';
    } else if (i >= 46 && i <= 100) {
      // ตรวจคุณสมบัติผ่านแล้ว แต่ยังไม่ได้โทร
      qualStatus = 'QUALIFIED';
    }

    const app = await prisma.application.create({
      data: {
        applicationNumber: appNum,
        courseId: course.id,
        formId: courseForm.id,
        idCardNumber: idCard,
        firstName: `${fn}`,
        lastName: `${ln} (${i})`,
        phoneNumber: phone,
        email: `applicant${i}@example.com`,
        age,
        occupation: occ,
        educationLevel: edu,
        address: `123/${i} ถ.พหลโยธิน แขวงลาดยาว เขตจตุจักร กรุงเทพฯ`,
        submittedAt: new Date(Date.now() - (400 - i) * 3600000),
        documents: {
          create: [
            { documentTitle: 'สำเนาบัตรประชาชน', fileUrl: '/uploads/sample_id.jpg', status: qualStatus === 'QUALIFIED' ? 'APPROVED' : 'PENDING' },
            { documentTitle: 'รูปถ่ายหน้าตรง', fileUrl: '/uploads/sample_photo.jpg', status: qualStatus === 'QUALIFIED' ? 'APPROVED' : 'PENDING' }
          ]
        },
        screening: {
          create: {
            qualificationStatus: qualStatus,
            disqualifiedReason: qualStatus === 'NOT_QUALIFIED' ? 'อายุไม่อยู่ในช่วงที่กำหนด หรือเอกสารไม่ครบ' : null,
            evaluatedAt: qualStatus !== 'PENDING' ? new Date() : null,
            evaluatedById: qualStatus !== 'PENDING' ? admin.id : null,
          }
        },
        selection: {
          create: {
            selectionStatus,
            waitlistOrder,
            selectedDate: selectionStatus === 'SELECTED' ? new Date() : null,
            selectedById: selectionStatus === 'SELECTED' ? admin.id : null,
          }
        },
        contacts: contactStatus !== 'NOT_CONTACTED' ? {
          create: [
            {
              contactStatus,
              interestStatus,
              calledById: admin.id,
              notes: interestStatus === 'INTERESTED' ? 'โทรยืนยันแล้ว ผู้สมัครแจ้งว่าพร้อมเข้าฝึกอบรมครบ 5 วัน' : 'โทรไป 2 ครั้งยังไม่รับสาย',
              callAttempt: 1,
            }
          ]
        } : undefined
      }
    });
  }

  console.log('Seed completed successfully! 400 applicants generated.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

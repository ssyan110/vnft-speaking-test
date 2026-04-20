import { ChineseCharacter } from '../types';

const CHARS_PER_LESSON = 9;

/**
 * Raw character data in curriculum order.
 * Lesson numbers are auto-computed: every 9 characters = 1 lesson.
 * To add new characters, just append them to this array.
 */
type RawCharacter = Omit<ChineseCharacter, 'lesson'>;

const RAW_CHARACTERS: RawCharacter[] = [
  // ─── Your curriculum order ───
  // Bài 1 (index 0–8)
  { character: '一', pinyin: 'yī', hanViet: 'nhất', meaning: 'một', radical: '一 (yī) – bộ Nhất', characterType: 'Chỉ sự' },
  { character: '八', pinyin: 'bā', hanViet: 'bát', meaning: 'tám', radical: '八 (bā) – bộ Bát', characterType: 'Chỉ sự' },
  { character: '五', pinyin: 'wǔ', hanViet: 'ngũ', meaning: 'năm', radical: '二 (èr) – bộ Nhị', characterType: 'Chỉ sự' },
  { character: '不', pinyin: 'bù', hanViet: 'bất', meaning: 'không', radical: '一 (yī) – bộ Nhất', characterType: 'Giả tá' },
  { character: '大', pinyin: 'dà', hanViet: 'đại', meaning: 'to, lớn', radical: '大 (dà) – bộ Đại', characterType: 'Tượng hình' },
  { character: '口', pinyin: 'kǒu', hanViet: 'khẩu', meaning: 'miệng, nhân khẩu', radical: '口 (kǒu) – bộ Khẩu', characterType: 'Tượng hình' },
  { character: '白', pinyin: 'bái', hanViet: 'bạch', meaning: 'trắng', radical: '白 (bái) – bộ Bạch', characterType: 'Tượng hình' },
  { character: '女', pinyin: 'nǚ', hanViet: 'nữ', meaning: 'nữ, phụ nữ', radical: '女 (nǚ) – bộ Nữ', characterType: 'Tượng hình' },
  { character: '你', pinyin: 'nǐ', hanViet: 'nhĩ', meaning: 'bạn, anh, chị', radical: '亻 (rén) – bộ Nhân đứng', characterType: 'Hình thanh' },
  // Bài 2 (index 9–17)
  { character: '好', pinyin: 'hǎo', hanViet: 'hảo', meaning: 'tốt, đẹp', radical: '女 (nǚ) – bộ Nữ', characterType: 'Hội ý' },
  { character: '马', pinyin: 'mǎ', hanViet: 'mã', meaning: 'ngựa', radical: '马 (mǎ) – bộ Mã', characterType: 'Tượng hình' },
  { character: '太', pinyin: 'tài', hanViet: 'thái', meaning: 'quá, cực kỳ', radical: '大 (dà) – bộ Đại', characterType: 'Chỉ sự' },
  { character: '汉', pinyin: 'hàn', hanViet: 'hán', meaning: 'nhà Hán, người Hán', radical: '氵 (shuǐ) – bộ Thủy (ba chấm nước)', characterType: 'Hình thanh' },
  { character: '语', pinyin: 'yǔ', hanViet: 'ngữ', meaning: 'ngôn ngữ, lời nói', radical: '讠 (yán) – bộ Ngôn', characterType: 'Hình thanh' },
  { character: '吗', pinyin: 'ma', hanViet: 'ma', meaning: 'trợ từ nghi vấn', radical: '口 (kǒu) – bộ Khẩu', characterType: 'Hình thanh' },
  { character: '妈', pinyin: 'mā', hanViet: 'ma', meaning: 'mẹ', radical: '女 (nǚ) – bộ Nữ', characterType: 'Hình thanh' },
  { character: '爸', pinyin: 'bà', hanViet: 'ba', meaning: 'ba, bố', radical: '父 (fù) – bộ Phụ', characterType: 'Hình thanh' },
  { character: '很', pinyin: 'hěn', hanViet: 'ngận', meaning: 'rất', radical: '彳 (chì) – bộ Sách (bước chân trái)', characterType: 'Hình thanh' },
  // Bài 3 (index 18–26)
  { character: '忙', pinyin: 'máng', hanViet: 'mang', meaning: 'bận', radical: '忄 (xīn) – bộ Tâm đứng', characterType: 'Hình thanh' },
  { character: '他', pinyin: 'tā', hanViet: 'tha', meaning: 'anh ấy, ông ấy, họ', radical: '亻 (rén) – bộ Nhân đứng', characterType: 'Hình thanh' },
  { character: '她', pinyin: 'tā', hanViet: 'tha', meaning: 'cô ấy, chị ấy', radical: '女 (nǚ) – bộ Nữ', characterType: 'Hình thanh' },
  { character: '难', pinyin: 'nán', hanViet: 'nan', meaning: 'khó', radical: '隹 (zhuī) – bộ Chuy', characterType: 'Hình thanh' },
  { character: '六', pinyin: 'liù', hanViet: 'lục', meaning: 'sáu', radical: '八 (bā) – bộ Bát', characterType: 'Tượng hình' },
  { character: '七', pinyin: 'qī', hanViet: 'thất', meaning: 'bảy', radical: '一 (yī) – bộ Nhất', characterType: 'Chỉ sự' },
  { character: '九', pinyin: 'jiǔ', hanViet: 'cửu', meaning: 'chín', radical: '乙 (yǐ) – bộ Ất', characterType: 'Tượng hình' },
  { character: '学', pinyin: 'xué', hanViet: 'học', meaning: 'học', radical: '子 (zǐ) – bộ Tử', characterType: 'Hội ý' },
  { character: '去', pinyin: 'qù', hanViet: 'khứ', meaning: 'đi', radical: '厶 (sī) – bộ Khư', characterType: 'Hội ý' },
  // Bài 4 (index 27–35)
  { character: '北', pinyin: 'běi', hanViet: 'bắc', meaning: 'phía bắc', radical: '匕 (bǐ) – bộ Chủy', characterType: 'Hội ý' },
  { character: '京', pinyin: 'jīng', hanViet: 'kinh', meaning: 'kinh đô', radical: '亠 (tóu) – bộ Đầu', characterType: 'Tượng hình' },
  { character: '对', pinyin: 'duì', hanViet: 'đối', meaning: 'đúng, đối với', radical: '寸 (cùn) – bộ Thốn', characterType: 'Hội ý' },
  { character: '明', pinyin: 'míng', hanViet: 'minh', meaning: 'sáng, rõ', radical: '日 (rì) – bộ Nhật', characterType: 'Hội ý' },
  { character: '天', pinyin: 'tiān', hanViet: 'thiên', meaning: 'trời, ngày', radical: '大 (dà) – bộ Đại', characterType: 'Chỉ sự' },
  { character: '见', pinyin: 'jiàn', hanViet: 'kiến', meaning: 'thấy, gặp', radical: '见 (jiàn) – bộ Kiến', characterType: 'Tượng hình' },
  { character: '银', pinyin: 'yín', hanViet: 'ngân', meaning: 'bạc, ngân hàng', radical: '钅 (jīn) – bộ Kim', characterType: 'Hình thanh' },
  { character: '行', pinyin: 'xíng/háng', hanViet: 'hành', meaning: 'đi, được, OK, hàng, tiệm', radical: '行 (xíng) – bộ Hành', characterType: 'Tượng hình' },
  { character: '二', pinyin: 'èr', hanViet: 'nhị', meaning: 'hai', radical: '二 (èr) – bộ Nhị', characterType: 'Chỉ sự' },
  // Bài 5 (index 36–44)
  { character: '三', pinyin: 'sān', hanViet: 'tam', meaning: 'ba', radical: '一 (yī) – bộ Nhất', characterType: 'Chỉ sự' },
  { character: '四', pinyin: 'sì', hanViet: 'tứ', meaning: 'bốn', radical: '囗 (wéi) – bộ Vi', characterType: 'Chỉ sự' },
  { character: '今', pinyin: 'jīn', hanViet: 'kim', meaning: 'nay, hiện tại, bây giờ', radical: '人 (rén) – bộ Nhân', characterType: 'Chỉ sự' },
  { character: '关', pinyin: 'guān', hanViet: 'quan', meaning: 'đóng, tắt, cửa ải, liên quan', radical: '丷 (bā) – bộ Bát', characterType: 'Hội ý' },
  { character: '星', pinyin: 'xīng', hanViet: 'tinh', meaning: 'ngôi sao', radical: '日 (rì) – bộ Nhật', characterType: 'Hình thanh' },
  { character: '期', pinyin: 'qī', hanViet: 'kỳ', meaning: 'kỳ, thời hạn, giai đoạn', radical: '月 (yuè) – bộ Nguyệt', characterType: 'Hình thanh' },
  { character: '几', pinyin: 'jǐ', hanViet: 'kỷ', meaning: 'mấy, bao nhiêu', radical: '几 (jǐ) – bộ Kỷ', characterType: 'Tượng hình' },
  { character: '我', pinyin: 'wǒ', hanViet: 'ngã', meaning: 'tôi', radical: '戈 (gē) – bộ Qua', characterType: 'Giả tá' },
  { character: '回', pinyin: 'huí', hanViet: 'hồi', meaning: 'quay lại, trở về', radical: '囗 (wéi) – bộ Vi', characterType: 'Tượng hình' },
  // Bài 6 (index 45–53)
  { character: '校', pinyin: 'xiào', hanViet: 'hiệu', meaning: 'trường, trường học', radical: '木 (mù) – bộ Mộc', characterType: 'Hình thanh' },
  { character: '那', pinyin: 'nà, nèi', hanViet: 'na', meaning: 'kia, đó', radical: '阝 (yì) – bộ Ấp', characterType: 'Hình thanh' },
  { character: '哪', pinyin: 'nǎ, něi', hanViet: 'na', meaning: 'nào, đâu, ở đâu', radical: '口 (kǒu) – bộ Khẩu', characterType: 'Hình thanh' },
  { character: '十', pinyin: 'shí', hanViet: 'thập', meaning: 'mười', radical: '十 (shí) – bộ Thập', characterType: 'Chỉ sự' },
  { character: '工', pinyin: 'gōng', hanViet: 'công', meaning: 'công, việc, công việc, thợ', radical: '工 (gōng) – bộ Công', characterType: 'Tượng hình' },
  { character: '作', pinyin: 'zuò', hanViet: 'tác', meaning: 'làm, tạo ra, sáng tạo, làm việc', radical: '亻 (rén) – bộ Nhân đứng', characterType: 'Hình thanh' },
  { character: '日', pinyin: 'rì', hanViet: 'nhật', meaning: 'mặt trời, ngày', radical: '日 (rì) – bộ Nhật', characterType: 'Tượng hình' },
  { character: '是', pinyin: 'shì', hanViet: 'thị', meaning: 'là, đúng, phải', radical: '日 (rì) – bộ Nhật', characterType: 'Hội ý' },
  { character: '这', pinyin: 'zhè', hanViet: 'giá', meaning: 'đây, cái này', radical: '辶 (chuò) – bộ Sước', characterType: 'Hình thanh' },
  // Bài 7 (index 54–62)
  { character: '进', pinyin: 'jìn', hanViet: 'tiến', meaning: 'vào, tiến vào, tiến lên', radical: '辶 (chuò) – bộ Sước', characterType: 'Hội ý' },
  { character: '老', pinyin: 'lǎo', hanViet: 'lão', meaning: 'già, lớn tuổi, cũ, lâu năm', radical: '老 (lǎo) – bộ Lão', characterType: 'Hội ý' },
  { character: '师', pinyin: 'shī', hanViet: 'sư', meaning: 'thầy, giáo viên, sư phụ', radical: '巾 (jīn) – bộ Cân', characterType: 'Hội ý' },
  { character: '身', pinyin: 'shēn', hanViet: 'thân', meaning: 'thân, thân thể, cơ thể', radical: '身 (shēn) – bộ Thân', characterType: 'Tượng hình' },
  { character: '体', pinyin: 'tǐ', hanViet: 'thể', meaning: 'thân thể, cơ thể', radical: '亻 (rén) – bộ Nhân đứng', characterType: 'Hội ý' },
  { character: '谢', pinyin: 'xiè', hanViet: 'tạ', meaning: 'cảm ơn, xin lỗi, từ chối, tàn', radical: '讠 (yán) – bộ Ngôn', characterType: 'Hình thanh' },
  { character: '人', pinyin: 'rén', hanViet: 'nhân', meaning: 'người', radical: '人 (rén) – bộ Nhân', characterType: 'Tượng hình' },
  { character: '问', pinyin: 'wèn', hanViet: 'vấn', meaning: 'hỏi', radical: '门 (mén) – bộ Môn', characterType: 'Hình thanh' },
  { character: '叫', pinyin: 'jiào', hanViet: 'khiếu', meaning: 'gọi, kêu', radical: '口 (kǒu) – bộ Khẩu', characterType: 'Hình thanh' },
  // Bài 8 (index 63–71)
  { character: '名', pinyin: 'míng', hanViet: 'danh', meaning: 'tên, tên gọi', radical: '夕 (xī) – bộ Tịch', characterType: 'Hội ý' },
  { character: '字', pinyin: 'zì', hanViet: 'tự', meaning: 'chữ, chữ viết, văn tự', radical: '子 (zǐ) – bộ Tử', characterType: 'Hội ý' },
  { character: '国', pinyin: 'guó', hanViet: 'quốc', meaning: 'nước, quốc gia', radical: '囗 (wéi) – bộ Vi', characterType: 'Hội ý' },
  { character: '中', pinyin: 'zhōng', hanViet: 'trung', meaning: 'ở giữa, trung tâm', radical: '丨 (gǔn) – bộ Cổn', characterType: 'Tượng hình' },
  { character: '文', pinyin: 'wén', hanViet: 'văn', meaning: 'văn, chữ viết, văn tự, hoa văn', radical: '文 (wén) – bộ Văn', characterType: 'Tượng hình' },
  { character: '习', pinyin: 'xí', hanViet: 'tập', meaning: 'luyện tập, học', radical: '乙 (yǐ) – bộ Ất', characterType: 'Hội ý' },
  { character: '发', pinyin: 'fā', hanViet: 'phát', meaning: 'phát ra, phát triển, phát sinh', radical: '又 (yòu) – bộ Hựu', characterType: 'Hình thanh' },
  { character: '音', pinyin: 'yīn', hanViet: 'âm', meaning: 'âm thanh, tiếng', radical: '音 (yīn) – bộ Âm', characterType: 'Chỉ sự' },
  { character: '朋', pinyin: 'péng', hanViet: 'bằng', meaning: 'bạn bè', radical: '月 (yuè) – bộ Nguyệt', characterType: 'Tượng hình' },
  // Bài 9 (index 72–80)
  { character: '友', pinyin: 'yǒu', hanViet: 'hữu', meaning: 'bạn, bạn bè', radical: '又 (yòu) – bộ Hựu', characterType: 'Hội ý' },
  { character: '书', pinyin: 'shū', hanViet: 'thư', meaning: 'sách, viết, ghi chép', radical: '乙 (yǐ) – bộ Ất', characterType: 'Giả tá' },
  { character: '个', pinyin: 'gè', hanViet: 'cá', meaning: 'lượng từ (cái, chiếc, con)', radical: '亻 (rén) – bộ Nhân đứng', characterType: 'Tượng hình' },
  { character: '午', pinyin: 'wǔ', hanViet: 'ngọ', meaning: 'trưa, buổi trưa', radical: '十 (shí) – bộ Thập', characterType: 'Tượng hình' },
  { character: '子', pinyin: 'zǐ', hanViet: 'tử', meaning: 'con, con cái, đứa trẻ', radical: '子 (zǐ) – bộ Tử', characterType: 'Tượng hình' },
  { character: '头', pinyin: 'tóu', hanViet: 'đầu', meaning: 'đầu, cái đầu', radical: '大 (dà) – bộ Đại', characterType: 'Hình thanh' },
  { character: '要', pinyin: 'yào', hanViet: 'yếu', meaning: 'muốn, cần', radical: '襾 (yà) – bộ Á', characterType: 'Hình thanh' },
  { character: '吃', pinyin: 'chī', hanViet: 'ngật', meaning: 'ăn', radical: '口 (kǒu) – bộ Khẩu', characterType: 'Hình thanh' },
  { character: '饭', pinyin: 'fàn', hanViet: 'phạn', meaning: 'cơm', radical: '饣 (shí) – bộ Thực', characterType: 'Hình thanh' },
  // Bài 10 (index 81–89)
  { character: '些', pinyin: 'xiē', hanViet: 'ta', meaning: 'một ít, vài, một số', radical: '止 (zhǐ) – bộ Chỉ', characterType: 'Hội ý' },
  { character: '包', pinyin: 'bāo', hanViet: 'bao', meaning: 'gói, bao, bọc, chứa đựng', radical: '勹 (bāo) – bộ Bao', characterType: 'Hội ý' },
  { character: '面', pinyin: 'miàn', hanViet: 'diện', meaning: 'mặt, bề mặt, mì', radical: '面 (miàn) – bộ Diện', characterType: 'Tượng hình' },
  { character: '条', pinyin: 'tiáo', hanViet: 'điều', meaning: 'sợi, vật dài; điều, khoản; lượng từ', radical: '木 (mù) – bộ Mộc', characterType: 'Hình thanh' },
  { character: '喝', pinyin: 'hē', hanViet: 'hạt', meaning: 'uống', radical: '口 (kǒu) – bộ Khẩu', characterType: 'Hình thanh' },
  { character: '们', pinyin: 'men', hanViet: 'môn', meaning: 'trợ từ số nhiều dùng sau đại từ hoặc từ chỉ người', radical: '亻 (rén) – bộ Nhân đứng', characterType: 'Hình thanh' },
  { character: '小', pinyin: 'xiǎo', hanViet: 'tiểu', meaning: 'nhỏ, bé', radical: '小 (xiǎo) – bộ Tiểu', characterType: 'Tượng hình' },
  { character: '月', pinyin: 'yuè', hanViet: 'nguyệt', meaning: 'mặt trăng, tháng', radical: '月 (yuè) – bộ Nguyệt', characterType: 'Tượng hình' },
  { character: '上', pinyin: 'shàng', hanViet: 'thượng', meaning: 'trên, lên, phía trên', radical: '一 (yī) – bộ Nhất', characterType: 'Chỉ sự' },
  // Bài 11 (index 90–98)
  { character: '下', pinyin: 'xià', hanViet: 'hạ', meaning: 'dưới, xuống, phía dưới', radical: '一 (yī) – bộ Nhất', characterType: 'Chỉ sự' },
  { character: '生', pinyin: 'shēng', hanViet: 'sinh', meaning: 'sinh, sống, sinh ra', radical: '生 (shēng) – bộ Sinh', characterType: 'Chỉ sự' },
  { character: '昨', pinyin: 'zuó', hanViet: 'tạc', meaning: 'hôm qua', radical: '日 (rì) – bộ Nhật', characterType: 'Hình thanh' },
  { character: '门', pinyin: 'mén', hanViet: 'môn', meaning: 'cửa', radical: '门 (mén) – bộ Môn', characterType: 'Tượng hình' },
  { character: '米', pinyin: 'mǐ', hanViet: 'mễ', meaning: 'gạo, mét', radical: '米 (mǐ) – bộ Mễ', characterType: 'Tượng hình' },
  { character: '也', pinyin: 'yě', hanViet: 'dã', meaning: 'cũng', radical: '乙 (yǐ) – bộ Ất', characterType: 'Giả tá' },
  { character: '又', pinyin: 'yòu', hanViet: 'hựu', meaning: 'lại, nữa', radical: '又 (yòu) – bộ Hựu', characterType: 'Tượng hình' },
  { character: '了', pinyin: 'le', hanViet: 'liễu', meaning: 'trợ từ chỉ sự hoàn thành; xong, rồi', radical: '乙 (yǐ) – bộ Ất', characterType: 'Giả tá' },
  { character: '木', pinyin: 'mù', hanViet: 'mộc', meaning: 'cây, gỗ', radical: '木 (mù) – bộ Mộc', characterType: 'Tượng hình' },
  // Bài 12 (index 99–107)
  { character: '休', pinyin: 'xiū', hanViet: 'hưu', meaning: 'nghỉ ngơi', radical: '亻 (rén) – bộ Nhân đứng', characterType: 'Hội ý' },
  { character: '亡', pinyin: 'wáng', hanViet: 'vong', meaning: 'mất, chết, vong', radical: '亠 (tóu) – bộ Đầu', characterType: 'Chỉ sự' },
  { character: '酒', pinyin: 'jiǔ', hanViet: 'tửu', meaning: 'rượu', radical: '氵 (shuǐ) – bộ Thủy (ba chấm nước)', characterType: 'Hình thanh' },
  { character: '元', pinyin: 'yuán', hanViet: 'nguyên', meaning: 'đầu, đầu tiên, bắt đầu, đồng (tiền)', radical: '儿 (ér) – bộ Nhi', characterType: 'Chỉ sự' },
  { character: '毛', pinyin: 'máo', hanViet: 'mao', meaning: 'lông, hào', radical: '毛 (máo) – bộ Mao', characterType: 'Tượng hình' },
  { character: '分', pinyin: 'fēn', hanViet: 'phân', meaning: 'chia ra, phân chia', radical: '刀 (dāo) – bộ Đao', characterType: 'Hội ý' },
  { character: '斤', pinyin: 'jīn', hanViet: 'cân', meaning: 'cân, đơn vị cân nặng', radical: '斤 (jīn) – bộ Cân', characterType: 'Tượng hình' },
  { character: '多', pinyin: 'duō', hanViet: 'đa', meaning: 'nhiều', radical: '夕 (xī) – bộ Tịch', characterType: 'Hội ý' },
  { character: '少', pinyin: 'shǎo', hanViet: 'thiểu', meaning: 'ít, thiếu, trẻ', radical: '小 (xiǎo) – bộ Tiểu', characterType: 'Tượng hình' },
  // Bài 13 (index 108–116)
  { character: '还', pinyin: 'hái, huán', hanViet: 'hoàn', meaning: 'còn, vẫn, lại; trả, quay về', radical: '辶 (chuò) – bộ Sước', characterType: 'Hình thanh' },
  { character: '买', pinyin: 'mǎi', hanViet: 'mãi', meaning: 'mua', radical: '乙 (yǐ) – bộ Ất', characterType: 'Hội ý' },
  { character: '卖', pinyin: 'mài', hanViet: 'mại', meaning: 'bán', radical: '十 (shí) – bộ Thập', characterType: 'Hội ý' },
  { character: '吧', pinyin: 'ba', hanViet: 'ba', meaning: 'trợ từ ngữ khí cuối câu, biểu thị đề nghị, phỏng đoán hoặc làm nhẹ giọng', radical: '口 (kǒu) – bộ Khẩu', characterType: 'Hình thanh' },
  { character: '两', pinyin: 'liǎng', hanViet: 'lưỡng', meaning: 'hai, đôi, cặp, hai bên', radical: '一 (yī) – bộ Nhất', characterType: 'Tượng hình' },
  { character: '别', pinyin: 'bié', hanViet: 'biệt', meaning: 'khác, đừng, tách ra, từ biệt', radical: '刂 (dāo) – bộ Đao đứng', characterType: 'Hội ý' },
];


/** Auto-assign lesson numbers: every 9 characters = 1 lesson (starting from Bài 1). */
export const CHINESE_CHARACTERS: ChineseCharacter[] = RAW_CHARACTERS.map((raw, index) => ({
  ...raw,
  lesson: Math.floor(index / CHARS_PER_LESSON) + 1,
}));

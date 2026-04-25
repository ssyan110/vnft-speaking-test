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
  { character: '一', pinyin: 'yī', hanViet: 'nhất', meaning: 'một' },
  { character: '八', pinyin: 'bā', hanViet: 'bát', meaning: 'tám' },
  { character: '五', pinyin: 'wǔ', hanViet: 'ngũ', meaning: 'năm' },
  { character: '不', pinyin: 'bù', hanViet: 'bất', meaning: 'không' },
  { character: '大', pinyin: 'dà', hanViet: 'đại', meaning: 'to, lớn' },
  { character: '口', pinyin: 'kǒu', hanViet: 'khẩu', meaning: 'miệng, nhân khẩu' },
  { character: '白', pinyin: 'bái', hanViet: 'bạch', meaning: 'trắng' },
  { character: '女', pinyin: 'nǚ', hanViet: 'nữ', meaning: 'nữ, phụ nữ' },
  { character: '你', pinyin: 'nǐ', hanViet: 'nhĩ', meaning: 'bạn, anh, chị' },
  // Bài 2 (index 9–17)
  { character: '好', pinyin: 'hǎo', hanViet: 'hảo', meaning: 'tốt, đẹp' },
  { character: '马', pinyin: 'mǎ', hanViet: 'mã', meaning: 'ngựa' },
  { character: '太', pinyin: 'tài', hanViet: 'thái', meaning: 'quá, cực kỳ' },
  { character: '汉', pinyin: 'hàn', hanViet: 'hán', meaning: 'nhà Hán, người Hán' },
  { character: '语', pinyin: 'yǔ', hanViet: 'ngữ', meaning: 'ngôn ngữ, lời nói' },
  { character: '吗', pinyin: 'ma', hanViet: 'ma', meaning: 'trợ từ nghi vấn' },
  { character: '妈', pinyin: 'mā', hanViet: 'ma', meaning: 'mẹ' },
  { character: '爸', pinyin: 'bà', hanViet: 'ba', meaning: 'ba, bố' },
  { character: '很', pinyin: 'hěn', hanViet: 'ngận', meaning: 'rất' },
  // Bài 3 (index 18–26)
  { character: '忙', pinyin: 'máng', hanViet: 'mang', meaning: 'bận' },
  { character: '他', pinyin: 'tā', hanViet: 'tha', meaning: 'anh ấy, ông ấy, họ' },
  { character: '她', pinyin: 'tā', hanViet: 'tha', meaning: 'cô ấy, chị ấy' },
  { character: '难', pinyin: 'nán', hanViet: 'nan', meaning: 'khó' },
  { character: '六', pinyin: 'liù', hanViet: 'lục', meaning: 'sáu' },
  { character: '七', pinyin: 'qī', hanViet: 'thất', meaning: 'bảy' },
  { character: '九', pinyin: 'jiǔ', hanViet: 'cửu', meaning: 'chín' },
  { character: '学', pinyin: 'xué', hanViet: 'học', meaning: 'học' },
  { character: '去', pinyin: 'qù', hanViet: 'khứ', meaning: 'đi' },
  // Bài 4 (index 27–35)
  { character: '北', pinyin: 'běi', hanViet: 'bắc', meaning: 'phía bắc' },
  { character: '京', pinyin: 'jīng', hanViet: 'kinh', meaning: 'kinh đô' },
  { character: '对', pinyin: 'duì', hanViet: 'đối', meaning: 'đúng, đối với' },
  { character: '明', pinyin: 'míng', hanViet: 'minh', meaning: 'sáng, rõ' },
  { character: '天', pinyin: 'tiān', hanViet: 'thiên', meaning: 'trời, ngày' },
  { character: '见', pinyin: 'jiàn', hanViet: 'kiến', meaning: 'thấy, gặp' },
  { character: '银', pinyin: 'yín', hanViet: 'ngân', meaning: 'bạc, ngân hàng' },
  { character: '行', pinyin: 'xíng/háng', hanViet: 'hành', meaning: 'đi, được, OK, hàng, tiệm' },
  { character: '二', pinyin: 'èr', hanViet: 'nhị', meaning: 'hai' },
  // Bài 5 (index 36–44)
  { character: '三', pinyin: 'sān', hanViet: 'tam', meaning: 'ba' },
  { character: '四', pinyin: 'sì', hanViet: 'tứ', meaning: 'bốn' },
  { character: '今', pinyin: 'jīn', hanViet: 'kim', meaning: 'nay, hiện tại, bây giờ' },
  { character: '关', pinyin: 'guān', hanViet: 'quan', meaning: 'đóng, tắt, cửa ải, liên quan' },
  { character: '星', pinyin: 'xīng', hanViet: 'tinh', meaning: 'ngôi sao' },
  { character: '期', pinyin: 'qī', hanViet: 'kỳ', meaning: 'kỳ, thời hạn, giai đoạn' },
  { character: '几', pinyin: 'jǐ', hanViet: 'kỷ', meaning: 'mấy, bao nhiêu' },
  { character: '我', pinyin: 'wǒ', hanViet: 'ngã', meaning: 'tôi' },
  { character: '回', pinyin: 'huí', hanViet: 'hồi', meaning: 'quay lại, trở về' },
  // Bài 6 (index 45–53)
  { character: '校', pinyin: 'xiào', hanViet: 'hiệu', meaning: 'trường, trường học' },
  { character: '那', pinyin: 'nà, nèi', hanViet: 'na', meaning: 'kia, đó' },
  { character: '哪', pinyin: 'nǎ, něi', hanViet: 'na', meaning: 'nào, đâu, ở đâu' },
  { character: '十', pinyin: 'shí', hanViet: 'thập', meaning: 'mười' },
  { character: '工', pinyin: 'gōng', hanViet: 'công', meaning: 'công, việc, công việc, thợ' },
  { character: '作', pinyin: 'zuò', hanViet: 'tác', meaning: 'làm, tạo ra, sáng tạo, làm việc' },
  { character: '日', pinyin: 'rì', hanViet: 'nhật', meaning: 'mặt trời, ngày' },
  { character: '是', pinyin: 'shì', hanViet: 'thị', meaning: 'là, đúng, phải' },
  { character: '这', pinyin: 'zhè', hanViet: 'giá', meaning: 'đây, cái này' },
  // Bài 7 (index 54–62)
  { character: '进', pinyin: 'jìn', hanViet: 'tiến', meaning: 'vào, tiến vào, tiến lên' },
  { character: '老', pinyin: 'lǎo', hanViet: 'lão', meaning: 'già, lớn tuổi, cũ, lâu năm' },
  { character: '师', pinyin: 'shī', hanViet: 'sư', meaning: 'thầy, giáo viên, sư phụ' },
  { character: '身', pinyin: 'shēn', hanViet: 'thân', meaning: 'thân, thân thể, cơ thể' },
  { character: '体', pinyin: 'tǐ', hanViet: 'thể', meaning: 'thân thể, cơ thể' },
  { character: '谢', pinyin: 'xiè', hanViet: 'tạ', meaning: 'cảm ơn, xin lỗi, từ chối, tàn' },
  { character: '人', pinyin: 'rén', hanViet: 'nhân', meaning: 'người' },
  { character: '问', pinyin: 'wèn', hanViet: 'vấn', meaning: 'hỏi' },
  { character: '叫', pinyin: 'jiào', hanViet: 'khiếu', meaning: 'gọi, kêu' },
  // Bài 8 (index 63–71)
  { character: '名', pinyin: 'míng', hanViet: 'danh', meaning: 'tên, tên gọi' },
  { character: '字', pinyin: 'zì', hanViet: 'tự', meaning: 'chữ, chữ viết, văn tự' },
  { character: '国', pinyin: 'guó', hanViet: 'quốc', meaning: 'nước, quốc gia' },
  { character: '中', pinyin: 'zhōng', hanViet: 'trung', meaning: 'ở giữa, trung tâm' },
  { character: '文', pinyin: 'wén', hanViet: 'văn', meaning: 'văn, chữ viết, văn tự, hoa văn' },
  { character: '习', pinyin: 'xí', hanViet: 'tập', meaning: 'luyện tập, học' },
  { character: '发', pinyin: 'fā', hanViet: 'phát', meaning: 'phát ra, phát triển, phát sinh' },
  { character: '音', pinyin: 'yīn', hanViet: 'âm', meaning: 'âm thanh, tiếng' },
  { character: '朋', pinyin: 'péng', hanViet: 'bằng', meaning: 'bạn bè' },
  // Bài 9 (index 72–80)
  { character: '友', pinyin: 'yǒu', hanViet: 'hữu', meaning: 'bạn, bạn bè' },
  { character: '书', pinyin: 'shū', hanViet: 'thư', meaning: 'sách, viết, ghi chép' },
  { character: '个', pinyin: 'gè', hanViet: 'cá', meaning: 'lượng từ (cái, chiếc, con)' },
  { character: '午', pinyin: 'wǔ', hanViet: 'ngọ', meaning: 'trưa, buổi trưa' },
  { character: '子', pinyin: 'zǐ', hanViet: 'tử', meaning: 'con, con cái, đứa trẻ' },
  { character: '头', pinyin: 'tóu', hanViet: 'đầu', meaning: 'đầu, cái đầu' },
  { character: '要', pinyin: 'yào', hanViet: 'yếu', meaning: 'muốn, cần' },
  { character: '吃', pinyin: 'chī', hanViet: 'ngật', meaning: 'ăn' },
  { character: '饭', pinyin: 'fàn', hanViet: 'phạn', meaning: 'cơm' },
  // Bài 10 (index 81–89)
  { character: '些', pinyin: 'xiē', hanViet: 'ta', meaning: 'một ít, vài, một số' },
  { character: '包', pinyin: 'bāo', hanViet: 'bao', meaning: 'gói, bao, bọc, chứa đựng' },
  { character: '面', pinyin: 'miàn', hanViet: 'diện', meaning: 'mặt, bề mặt, mì' },
  { character: '条', pinyin: 'tiáo', hanViet: 'điều', meaning: 'sợi, vật dài; điều, khoản; lượng từ' },
  { character: '喝', pinyin: 'hē', hanViet: 'hạt', meaning: 'uống' },
  { character: '们', pinyin: 'men', hanViet: 'môn', meaning: 'trợ từ số nhiều dùng sau đại từ hoặc từ chỉ người' },
  { character: '小', pinyin: 'xiǎo', hanViet: 'tiểu', meaning: 'nhỏ, bé' },
  { character: '月', pinyin: 'yuè', hanViet: 'nguyệt', meaning: 'mặt trăng, tháng' },
  { character: '上', pinyin: 'shàng', hanViet: 'thượng', meaning: 'trên, lên, phía trên' },
  // Bài 11 (index 90–98)
  { character: '下', pinyin: 'xià', hanViet: 'hạ', meaning: 'dưới, xuống, phía dưới' },
  { character: '生', pinyin: 'shēng', hanViet: 'sinh', meaning: 'sinh, sống, sinh ra' },
  { character: '昨', pinyin: 'zuó', hanViet: 'tạc', meaning: 'hôm qua' },
  { character: '门', pinyin: 'mén', hanViet: 'môn', meaning: 'cửa' },
  { character: '米', pinyin: 'mǐ', hanViet: 'mễ', meaning: 'gạo, mét' },
  { character: '也', pinyin: 'yě', hanViet: 'dã', meaning: 'cũng' },
  { character: '又', pinyin: 'yòu', hanViet: 'hựu', meaning: 'lại, nữa' },
  { character: '了', pinyin: 'le', hanViet: 'liễu', meaning: 'trợ từ chỉ sự hoàn thành; xong, rồi' },
  { character: '木', pinyin: 'mù', hanViet: 'mộc', meaning: 'cây, gỗ' },
  // Bài 12 (index 99–107)
  { character: '休', pinyin: 'xiū', hanViet: 'hưu', meaning: 'nghỉ ngơi' },
  { character: '亡', pinyin: 'wáng', hanViet: 'vong', meaning: 'mất, chết, vong' },
  { character: '酒', pinyin: 'jiǔ', hanViet: 'tửu', meaning: 'rượu' },
  { character: '元', pinyin: 'yuán', hanViet: 'nguyên', meaning: 'đầu, đầu tiên, bắt đầu, đồng (tiền)' },
  { character: '毛', pinyin: 'máo', hanViet: 'mao', meaning: 'lông, hào' },
  { character: '分', pinyin: 'fēn', hanViet: 'phân', meaning: 'chia ra, phân chia' },
  { character: '斤', pinyin: 'jīn', hanViet: 'cân', meaning: 'cân, đơn vị cân nặng' },
  { character: '多', pinyin: 'duō', hanViet: 'đa', meaning: 'nhiều' },
  { character: '少', pinyin: 'shǎo', hanViet: 'thiểu', meaning: 'ít, thiếu, trẻ' },
  // Bài 13 (index 108–116)
  { character: '还', pinyin: 'hái, huán', hanViet: 'hoàn', meaning: 'còn, vẫn, lại; trả, quay về' },
  { character: '买', pinyin: 'mǎi', hanViet: 'mãi', meaning: 'mua' },
  { character: '卖', pinyin: 'mài', hanViet: 'mại', meaning: 'bán' },
  { character: '吧', pinyin: 'ba', hanViet: 'ba', meaning: 'trợ từ ngữ khí cuối câu, biểu thị đề nghị, phỏng đoán hoặc làm nhẹ giọng' },
  { character: '两', pinyin: 'liǎng', hanViet: 'lưỡng', meaning: 'hai, đôi, cặp, hai bên' },
  { character: '别', pinyin: 'bié', hanViet: 'biệt', meaning: 'khác, đừng, tách ra, từ biệt' },
  { character: '给', pinyin: 'gěi', hanViet: 'cấp', meaning: 'cho, cấp cho, cung cấp' },
  { character: '找', pinyin: 'zhǎo', hanViet: 'trảo', meaning: 'tìm, trả lại tiền thừa' },
  { character: '百', pinyin: 'bǎi', hanViet: 'bách', meaning: 'một trăm' },
  { character: '千', pinyin: 'qiān', hanViet: 'thiên', meaning: 'một nghìn' },
  { character: '万', pinyin: 'wàn', hanViet: 'vạn', meaning: 'mười nghìn' },
  { character: '美', pinyin: 'měi', hanViet: 'mỹ', meaning: 'đẹp, đẹp đẽ' },
  { character: '民', pinyin: 'mín', hanViet: 'dân', meaning: 'dân, người dân, dân thường' },
  { character: '先', pinyin: 'xiān', hanViet: 'tiên', meaning: 'trước, trước tiên, ưu tiên' },
  { character: '客', pinyin: 'kè', hanViet: 'khách', meaning: 'khách, người đến từ bên ngoài' },
  { character: '气', pinyin: 'qì', hanViet: 'khí', meaning: 'hơi, khí, không khí' },
  { character: '住', pinyin: 'zhù', hanViet: 'trú', meaning: 'ở, cư trú, dừng lại' },
  { character: '办', pinyin: 'bàn', hanViet: 'biện', meaning: 'làm, xử lý, giải quyết công việc' },
  { character: '公', pinyin: 'gōng', hanViet: 'công', meaning: 'của chung, công cộng' },
];


/** Auto-assign lesson numbers: every 9 characters = 1 lesson (starting from Bài 1). */
export const CHINESE_CHARACTERS: ChineseCharacter[] = RAW_CHARACTERS.map((raw, index) => ({
  ...raw,
  lesson: Math.floor(index / CHARS_PER_LESSON) + 1,
}));

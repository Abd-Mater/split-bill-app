import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { formatCurrency, categoryConfig, formatDate } from '@/utils/helpers';
import { buildSingleBillMessage } from '@/utils/whatsapp';
import { ShareModal } from '@/components/ShareModal';
import { 
  ArrowRight, Check, Clock, Users, TrendingUp, 
  Trash2, Edit2, Save, X 
} from 'lucide-react';

export function BillDetailScreen() {
  const { 
    bills, selectedBillId, navigate, getUserById, togglePayment, groups,
    updateBill, deleteBill, currentUser 
  } = useApp();
  
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const [justPaid, setJustPaid] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Form State
  const [editTitle, setEditTitle] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editCategory, setEditCategory] = useState<string>('food');
  const [editPaidBy, setEditPaidBy] = useState('');

  const bill = bills.find((b) => b.id === selectedBillId);
  
  // Initialize form when bill loads or edit mode starts
  useEffect(() => {
    if (bill) {
      setEditTitle(bill.title);
      setEditAmount(bill.totalAmount.toString());
      setEditCategory(bill.category);
      setEditPaidBy(bill.paidBy);
    }
  }, [bill, isEditing]);

  if (!bill) return null;

  const payer = getUserById(bill.paidBy);
  const config = categoryConfig[bill.category];
  const group = groups.find((g) => g.id === bill.groupId);
  const paidCount = bill.splits.filter((s) => s.paid).length;
  const progress = (paidCount / bill.splits.length) * 100;
  const done = progress === 100;

  const handleToggle = (billId: string, userId: string) => {
    setJustPaid(userId);
    togglePayment(billId, userId);
    setTimeout(() => setJustPaid(null), 800);
  };

  const handleUpdate = () => {
    if (!editTitle || !editAmount || Number(editAmount) <= 0) return;
    
    updateBill(bill.id, {
      title: editTitle,
      totalAmount: Number(editAmount),
      category: editCategory as any,
      paidBy: editPaidBy
    });
    setIsEditing(false);
  };

  const handleDelete = () => {
    deleteBill(bill.id);
    navigate('group-detail');
  };

  const handleWhatsAppShare = () => {
    const message = buildSingleBillMessage({
      groupName: group?.name || 'المجموعة',
      groupEmoji: group?.emoji || '📄',
      billTitle: bill.title,
      totalAmount: bill.totalAmount,
      paidByName: payer?.name || 'غير محدد',
      splits: bill.splits.map((s) => {
        const u = getUserById(s.userId);
        return {
          name: s.userId === currentUser.id ? 'أنت' : (u?.name || 'غير محدد'),
          amount: s.amount,
          paid: s.paid,
        };
      }),
    });
    setShareMessage(message);
  };

  if (showDeleteConfirm) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
        <div className="bg-white dark:bg-[#1e1e32] rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-scale-in">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
            <Trash2 className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-black text-center text-gray-900 dark:text-white mb-2">حذف الفاتورة؟</h3>
          <p className="text-center text-gray-500 dark:text-gray-400 mb-6">
            هل أنت متأكد من حذف فاتورة "{bill.title}"؟ لا يمكن التراجع عن هذا الإجراء.
          </p>
          <div className="flex gap-3">
            <button 
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1 py-3 rounded-xl font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-[#2d2d4a]"
            >
              إلغاء
            </button>
            <button 
              onClick={handleDelete}
              className="flex-1 py-3 rounded-xl font-bold text-white bg-red-500 shadow-lg shadow-red-500/30"
            >
              حذف نهائي
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-32 min-h-screen dark:bg-[#0f0f1a] bg-[#f0f4ff] relative">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 px-5 pt-14 pb-12 rounded-b-[2.5rem] relative overflow-hidden shadow-2xl shadow-indigo-500/25">
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-purple-400/10 rounded-full blur-3xl" />

        <div className="flex justify-between items-center mb-6 relative z-10">
          <button
            onClick={() => navigate('group-detail')}
            className="icon-btn w-10 h-10 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center"
          >
            <ArrowRight className="w-5 h-5 text-white" />
          </button>
          
          {/* Top Actions for Quick Access */}
          {!isEditing && (
            <div className="flex gap-2">
              <button 
                onClick={() => setShowDeleteConfirm(true)}
                className="w-10 h-10 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center text-white hover:bg-red-500/80 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setIsEditing(true)}
                className="w-10 h-10 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center text-white hover:bg-white/30 transition-colors"
              >
                <Edit2 className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        <div className="text-center relative stagger-1">
          {isEditing ? (
            <div className="space-y-4 animate-scale-in">
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full bg-white/20 backdrop-blur-md text-white placeholder-white/60 text-center text-xl font-bold py-2 rounded-xl border-2 border-transparent focus:border-white/50 outline-none"
                placeholder="عنوان الفاتورة"
              />
              <input
                type="number"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                className="w-full bg-white/20 backdrop-blur-md text-white placeholder-white/60 text-center text-3xl font-black py-2 rounded-xl border-2 border-transparent focus:border-white/50 outline-none"
                placeholder="0.00"
              />
            </div>
          ) : (
            <>
              <div className={`w-20 h-20 mx-auto rounded-3xl flex items-center justify-center text-4xl mb-4 ${config.color} shadow-xl`}>
                {config.emoji}
              </div>
              <h1 className="text-white text-2xl font-black">{bill.title}</h1>
              {bill.description && (
                <p className="text-indigo-200 text-sm mt-1">{bill.description}</p>
              )}
              <p className="text-white text-4xl font-black mt-4">{formatCurrency(bill.totalAmount)}</p>
            </>
          )}

          <div className="flex items-center justify-center gap-3 mt-4">
            <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5">
              <Users className="w-3.5 h-3.5 text-white/80" />
              <span className="text-white/90 text-xs font-medium">{group?.name}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 -mt-6 space-y-4">
        {/* Edit Form Extras */}
        {isEditing && (
          <div className="bg-white dark:bg-[#1e1e32] rounded-3xl p-5 shadow-xl animate-slide-up space-y-4">
            <div>
              <label className="text-sm font-bold text-gray-500 mb-2 block">التصنيف</label>
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {Object.entries(categoryConfig).map(([key, conf]) => (
                  <button
                    key={key}
                    onClick={() => setEditCategory(key)}
                    className={`flex-shrink-0 p-3 rounded-xl border-2 transition-all ${
                      editCategory === key
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/20'
                        : 'border-transparent bg-gray-50 dark:bg-[#2a2a3e]'
                    }`}
                  >
                    <span className="text-2xl block mb-1">{conf.emoji}</span>
                    <span className="text-[10px] font-bold block text-center">{conf.label}</span>
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="text-sm font-bold text-gray-500 mb-2 block">من دفع؟</label>
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {group?.members.map(member => {
                  const u = getUserById(member.userId);
                  return (
                    <button
                      key={member.userId}
                      onClick={() => setEditPaidBy(member.userId)}
                      className={`flex-shrink-0 px-4 py-2 rounded-xl border-2 transition-all font-bold text-sm ${
                        editPaidBy === member.userId
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:text-indigo-400'
                          : 'border-gray-100 dark:border-[#2d2d4a] bg-white dark:bg-[#2a2a3e] text-gray-600 dark:text-gray-300'
                      }`}
                    >
                      {u?.id === currentUser.id ? 'أنت' : u?.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Progress Card */}
        {!isEditing && (
          <div className="bg-white dark:bg-[#1e1e32] rounded-3xl shadow-xl shadow-black/6 dark:shadow-black/25 p-5 border border-gray-100 dark:border-[#2d2d4a] stagger-2">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-500" />
                <span className="font-black text-gray-900 dark:text-gray-100">حالة الدفع</span>
              </div>
              <span className={`text-sm font-black px-3 py-1 rounded-full ${
                done
                  ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                  : 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400'
              }`}>
                {paidCount}/{bill.splits.length}
              </span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-[#2a2a3e] rounded-full h-3 overflow-hidden">
              <div
                className={`h-3 rounded-full transition-all duration-700 ${done ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : 'bg-gradient-to-r from-indigo-400 to-indigo-600'}`}
                style={{ width: `${progress}%` }}
              />
            </div>
            {done && (
              <div className="flex items-center justify-center gap-2 mt-3 p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl animate-bounce-in">
                <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <p className="text-emerald-700 dark:text-emerald-400 text-sm font-bold">تم تسوية الفاتورة بالكامل! 🎉</p>
              </div>
            )}
          </div>
        )}

        {/* Splits */}
        {!isEditing && (
          <div className="stagger-3">
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="font-black text-gray-900 dark:text-gray-100">تفاصيل التقسيم</h2>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                {formatCurrency(bill.totalAmount / bill.splits.length)} / شخص
              </span>
            </div>
            <div className="space-y-2.5">
              {bill.splits.map((split, idx) => {
                const user = getUserById(split.userId);
                if (!user) return null;
                const isPayer = split.userId === bill.paidBy;
                const isMe = split.userId === currentUser.id;
                const isJustPaid = justPaid === split.userId;

                return (
                  <div
                    key={split.userId}
                    className={`bg-white dark:bg-[#1e1e32] rounded-3xl p-4 border-2 transition-all duration-300 animate-slide-up ${
                      split.paid
                        ? 'border-emerald-200 dark:border-emerald-500/30'
                        : 'border-gray-100 dark:border-[#2d2d4a]'
                    } ${isJustPaid ? 'scale-[1.02]' : ''}`}
                    style={{ animationDelay: `${idx * 0.05}s` }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-all ${
                          split.paid ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-gray-100 dark:bg-[#2a2a3e]'
                        }`}>
                          {user.avatar}
                        </div>
                        {isPayer && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-500 rounded-lg flex items-center justify-center shadow-md">
                            <span className="text-white text-[8px] font-black">دفع</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm">
                            {isMe ? 'أنت' : user.name}
                          </h3>
                          {isPayer && (
                            <span className="bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 text-xs px-2 py-0.5 rounded-full font-bold">الدافع</span>
                          )}
                        </div>
                        <p className={`text-xs mt-0.5 font-medium ${
                          split.paid ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-500 dark:text-orange-400'
                        }`}>
                          {split.paid
                            ? `✅ دفع ${split.paidAt ? formatDate(split.paidAt) : ''}`
                            : '⏳ لم يدفع بعد'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className="font-black text-gray-900 dark:text-gray-100">{formatCurrency(split.amount)}</span>
                        {!isPayer && (
                          <button
                            onClick={() => handleToggle(bill.id, split.userId)}
                            className={`toggle-btn w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm ${
                              split.paid
                                ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                                : 'bg-gray-100 dark:bg-[#2a2a3e] text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-[#3a3a4e]'
                            }`}
                          >
                            {split.paid ? (
                              <Check className="w-5 h-5" />
                            ) : (
                              <Clock className="w-5 h-5" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* WhatsApp Share Button */}
        {!isEditing && (
          <button
            onClick={handleWhatsAppShare}
            className="btn-premium w-full flex items-center justify-center gap-3 bg-[#25D366] text-white py-4 rounded-3xl font-black text-base shadow-xl shadow-[#25D366]/30 stagger-5"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            <span>مشاركة عبر واتساب</span>
          </button>
        )}
        
        <div className="h-10" />
      </div>

      {shareMessage && (
        <ShareModal message={shareMessage} onClose={() => setShareMessage(null)} />
      )}

      {/* Floating Action Buttons for Edit/Save */}
      {isEditing && (
        <div className="fixed bottom-6 left-5 right-5 flex gap-4 z-50 animate-slide-up">
          <button
            onClick={() => setIsEditing(false)}
            className="flex-1 bg-gray-900 dark:bg-gray-700 text-white py-4 rounded-2xl font-black shadow-lg flex items-center justify-center gap-2"
          >
            <X className="w-5 h-5" />
            إلغاء
          </button>
          <button
            onClick={handleUpdate}
            className="flex-1 bg-emerald-500 text-white py-4 rounded-2xl font-black shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            حفظ التغييرات
          </button>
        </div>
      )}
    </div>
  );
}

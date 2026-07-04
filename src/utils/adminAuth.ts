const ADMIN_PASSWORD = 'adminne';

export function requireAdminPassword(): boolean {
  const password = window.prompt('Nhập password admin để tiếp tục:');

  if (password === ADMIN_PASSWORD) {
    return true;
  }

  if (password !== null) {
    window.alert('Password không đúng.');
  }

  return false;
}

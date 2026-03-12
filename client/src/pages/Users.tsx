import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from "@/hooks/use-users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Pencil, Trash2, UserCheck, UserX, Users as UsersIcon } from "lucide-react";

type UserRole = 'admin' | 'formateur' | 'prestataire';
type UserStatus = 'ACTIF' | 'INACTIF';

interface UserFormData {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  role: UserRole;
  phone: string;
  address: string;
  siret: string;
}

const roleLabels: Record<UserRole, string> = {
  admin: 'Administrateur',
  formateur: 'Formateur salarié',
  prestataire: 'Prestataire',
};

const statusLabels: Record<UserStatus, string> = {
  ACTIF: 'Actif',
  INACTIF: 'Inactif',
};

const statusColors: Record<UserStatus, string> = {
  ACTIF: 'bg-green-100 text-green-800',
  INACTIF: 'bg-yellow-100 text-yellow-800',
};

export default function Users() {
  const { toast } = useToast();
  const { data: users, isLoading } = useUsers();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<string>('az');

  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    role: 'formateur',
    phone: '',
    address: '',
    siret: '',
  });

  const resetForm = () => {
    setFormData({
      email: '',
      firstName: '',
      lastName: '',
      password: '',
      role: 'formateur',
      phone: '',
      address: '',
      siret: '',
    });
  };

  const handleCreate = async () => {
    try {
      await createUser.mutateAsync({
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        password: formData.password,
        role: formData.role,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
        siret: formData.siret || undefined,
      });
      toast({ title: "Utilisateur créé avec succès" });
      setIsCreateOpen(false);
      resetForm();
    } catch (err) {
      toast({ title: "Erreur", description: (err as Error).message, variant: "destructive" });
    }
  };

  const handleEdit = async () => {
    if (!selectedUser) return;
    try {
      const updateData: any = {
        id: selectedUser.id,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
        siret: formData.siret || undefined,
        role: formData.role,
      };
      if (formData.password) {
        updateData.password = formData.password;
      }
      await updateUser.mutateAsync(updateData);
      toast({ title: "Utilisateur modifié avec succès" });
      setIsEditOpen(false);
      setSelectedUser(null);
      resetForm();
    } catch (err) {
      toast({ title: "Erreur", description: (err as Error).message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    try {
      await deleteUser.mutateAsync(selectedUser.id);
      toast({ title: "Utilisateur supprimé" });
      setIsDeleteOpen(false);
      setSelectedUser(null);
    } catch (err) {
      toast({ title: "Erreur", description: (err as Error).message, variant: "destructive" });
    }
  };

  const handleStatusChange = async (userId: string, newStatus: UserStatus) => {
    try {
      await updateUser.mutateAsync({ id: userId, status: newStatus });
      toast({ title: `Statut mis à jour: ${statusLabels[newStatus]}` });
    } catch (err) {
      toast({ title: "Erreur", description: (err as Error).message, variant: "destructive" });
    }
  };

  const openEditDialog = (user: any) => {
    setSelectedUser(user);
    setFormData({
      email: user.email || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      password: '',
      role: user.role || 'formateur',
      phone: user.phone || '',
      address: user.address || '',
      siret: user.siret || '',
    });
    setIsEditOpen(true);
  };

  const filteredUsers = (users?.filter(user => {
    if (filterRole !== 'all' && user.role !== filterRole) return false;
    if (filterStatus !== 'all' && user.status !== filterStatus) return false;
    return true;
  }) || []).sort((a, b) => {
    const nameA = `${a.lastName || ''} ${a.firstName || ''}`.trim().toLowerCase();
    const nameB = `${b.lastName || ''} ${b.firstName || ''}`.trim().toLowerCase();
    return sortOrder === 'za' ? nameB.localeCompare(nameA, 'fr') : nameA.localeCompare(nameB, 'fr');
  });

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <UsersIcon className="h-8 w-8" />
                Gestion des Utilisateurs
              </h1>
              <p className="text-muted-foreground mt-1">
                Gérez les utilisateurs et leurs droits d'accès
              </p>
            </div>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nouvel Utilisateur
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Créer un utilisateur</DialogTitle>
                  <DialogDescription>
                    Remplissez les informations pour créer un nouvel utilisateur
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Prénom</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Nom</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Mot de passe</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Rôle</Label>
                    <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v as UserRole })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-violet-100 border-violet-300">
                        <SelectItem value="admin" className="focus:bg-violet-200">Administrateur</SelectItem>
                        <SelectItem value="formateur" className="focus:bg-violet-200">Formateur salarié</SelectItem>
                        <SelectItem value="prestataire" className="focus:bg-violet-200">Prestataire</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="siret">Adresse</Label>
                    <Input
                      id="siret"
                      value={formData.siret}
                      onChange={(e) => setFormData({ ...formData, siret: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleCreate} disabled={createUser.isPending}>
                    {createUser.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Créer
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrer par rôle" />
              </SelectTrigger>
              <SelectContent className="bg-violet-100 border-violet-300">
                <SelectItem value="all" className="focus:bg-violet-200">Tous les rôles</SelectItem>
                <SelectItem value="admin" className="focus:bg-violet-200">Administrateur</SelectItem>
                <SelectItem value="formateur" className="focus:bg-violet-200">Formateur</SelectItem>
                <SelectItem value="prestataire" className="focus:bg-violet-200">Prestataire</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent className="bg-violet-100 border-violet-300">
                <SelectItem value="all" className="focus:bg-violet-200">Tous les statuts</SelectItem>
                <SelectItem value="ACTIF" className="focus:bg-violet-200">Actif</SelectItem>
                <SelectItem value="INACTIF" className="focus:bg-violet-200">Inactif</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Trier par nom" />
              </SelectTrigger>
              <SelectContent className="bg-violet-100 border-violet-300">
                <SelectItem value="az" className="focus:bg-violet-200">Nom A → Z</SelectItem>
                <SelectItem value="za" className="focus:bg-violet-200">Nom Z → A</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Users Table */}
          {isLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Téléphone</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.firstName} {user.lastName}
                      </TableCell>
                      <TableCell>
                        <a href={`mailto:${user.email}`} className="text-primary hover:underline">
                          {user.email}
                        </a>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {roleLabels[user.role as UserRole] || user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[user.status as UserStatus]}>
                          {statusLabels[user.status as UserStatus] || user.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.phone || '-'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {(user.id === 'fc6c33f9-0245-4b10-856c-3f4daa45b6b6') ? (
                            <>
                              <Badge variant="secondary" className="text-xs">Système</Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditDialog(user)}
                                title="Modifier le mot de passe"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              {user.status === 'ACTIF' ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleStatusChange(user.id, 'INACTIF')}
                                  title="Désactiver"
                                >
                                  <UserX className="h-4 w-4" />
                                </Button>
                              ) : user.status === 'INACTIF' ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleStatusChange(user.id, 'ACTIF')}
                                  title="Activer"
                                >
                                  <UserCheck className="h-4 w-4" />
                                </Button>
                              ) : null}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditDialog(user)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setIsDeleteOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredUsers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Aucun utilisateur trouvé
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </main>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier l'utilisateur</DialogTitle>
            <DialogDescription>
              Modifiez les informations de l'utilisateur
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-firstName">Prénom</Label>
                <Input
                  id="edit-firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-lastName">Nom</Label>
                <Input
                  id="edit-lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-password">Nouveau mot de passe (optionnel)</Label>
              <Input
                id="edit-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Laisser vide pour ne pas changer"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">Rôle</Label>
              <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v as UserRole })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-violet-100 border-violet-300">
                  <SelectItem value="admin" className="focus:bg-violet-200">Administrateur</SelectItem>
                  <SelectItem value="formateur" className="focus:bg-violet-200">Formateur salarié</SelectItem>
                  <SelectItem value="prestataire" className="focus:bg-violet-200">Prestataire</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Téléphone</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-siret">Adresse</Label>
              <Input
                id="edit-siret"
                value={formData.siret}
                onChange={(e) => setFormData({ ...formData, siret: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleEdit} disabled={updateUser.isPending}>
              {updateUser.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer définitivement l'utilisateur {selectedUser?.firstName} {selectedUser?.lastName} ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              {deleteUser.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

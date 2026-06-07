module.exports = class UserDto {
    email;
    id;
    firstName;
    lastName;
    phone;
    isAdmin;

    constructor(model) {
        this.email = model.email;
        this.id = model.id;
        this.firstName = model.first_name || '';
        this.lastName = model.last_name || '';
        this.phone = model.phone || '';
        this.isAdmin = model.is_admin || false;
    }
}

const mongoose = require('mongoose');
const Menu = require('../../../shared/models/administrativo/Menu');
const Acceso = require('../../../shared/models/administrativo/Acceso');
const AdministracionAuditoria = require('../../../shared/models/administrativo/AdministracionAuditoria');

class MenuController {
  // Get all menus with pagination
  static async getAll(req, res) {
    try {

      const filter = {};
      if (req.query.activo !== undefined) {
        filter.activo = req.query.activo === 'true';
      }

      const menus = await Menu.find(filter)
        .populate('menuSuperior', 'nombre')
        .sort({ orden: 1, nombre: 1 })
        ;

            res.json({
        success: true,
        data: menus
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo menús',
        error: error.message
      });
    }
  }

  // Get menu by ID
  static async getById(req, res) {
    try {
      const menu = await Menu.findById(req.params.id)
        .populate('menuSuperior', 'nombre');
      
      if (!menu) {
        return res.status(404).json({
          success: false,
          message: 'Menú no encontrado'
        });
      }

      res.json({
        success: true,
        data: menu
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo menú',
        error: error.message
      });
    }
  }

  // Create new menu
  static async create(req, res) {
    try {
      // Validate required fields
      const { nombre, ruta, icono, orden } = req.body;
      if (!nombre || !ruta || orden === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Los campos nombre, ruta y orden son obligatorios'
        });
      }

      // Check for duplicate menu name
      const existingMenu = await Menu.findOne({ nombre });
      if (existingMenu) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un menú con este nombre'
        });
      }

      // Validate parent menu if provided
      if (req.body.menuSuperior) {
        const parentMenu = await Menu.findById(req.body.menuSuperior);
        if (!parentMenu) {
          return res.status(400).json({
            success: false,
            message: 'El menú superior especificado no existe'
          });
        }
      }

      const menu = new Menu({
        ...req.body,
        fechaCreacion: new Date(),
        usuarioCreacion: req.user?.id || 'sistema'
      });
      
      await menu.save();
      await menu.populate('menuSuperior', 'nombre');

      // Non-critical audit log
      try {
        await AdministracionAuditoria.create({
          entidad: 'Menu',
          idEntidad: menu._id,
          accion: 'CREATE',
          usuarioId: req.user?.id || 'sistema',
          datosNuevos: menu.toObject(),
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          fecha: new Date()
        });
      } catch (auditError) {
        console.warn('Error en audit log:', auditError.message);
      }

      res.status(201).json({
        success: true,
        message: 'Menú creado exitosamente',
        data: menu
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error creando menú',
        error: error.message
      });
    }
  }

  // Update menu
  static async update(req, res) {
    try {
      const menuAnterior = await Menu.findById(req.params.id);
      
      if (!menuAnterior) {
        return res.status(404).json({
          success: false,
          message: 'Menú no encontrado'
        });
      }

      const menu = await Menu.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      ).populate('menuSuperior', 'nombre');

      // Non-critical audit log
      try {
        await AdministracionAuditoria.create({
          entidad: 'Menu',
          idEntidad: menu._id,
          accion: 'UPDATE',
          usuarioId: req.user?.id || 'sistema',
          datosAnteriores: menuAnterior.toObject(),
          datosNuevos: menu.toObject(),
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          fecha: new Date()
        });
      } catch (auditError) {
        console.warn('Error en audit log:', auditError.message);
      }

      res.json({
        success: true,
        message: 'Menú actualizado exitosamente',
        data: menu
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error actualizando menú',
        error: error.message
      });
    }
  }

  // Delete menu
  static async delete(req, res) {
    try {
      const menu = await Menu.findById(req.params.id);
      
      if (!menu) {
        return res.status(404).json({
          success: false,
          message: 'Menú no encontrado'
        });
      }

      // Check if menu has children
      const childrenCount = await Menu.countDocuments({ menuSuperior: req.params.id });
      if (childrenCount > 0) {
        return res.status(400).json({
          success: false,
          message: 'No se puede eliminar un menú que tiene submenús'
        });
      }

      // Check if menu is in use
      const accesoCount = await Acceso.countDocuments({ menuId: req.params.id });
      if (accesoCount > 0) {
        return res.status(400).json({
          success: false,
          message: 'No se puede eliminar un menú que está siendo utilizado en accesos'
        });
      }

      await Menu.findByIdAndDelete(req.params.id);

      // Non-critical audit log
      try {
        await AdministracionAuditoria.create({
          entidad: 'Menu',
          idEntidad: menu._id,
          accion: 'DELETE',
          usuarioId: req.user?.id || 'sistema',
          datosAnteriores: menu.toObject(),
          datosNuevos: null,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          fecha: new Date()
        });
      } catch (auditError) {
        console.warn('Error en audit log:', auditError.message);
      }

      res.json({
        success: true,
        message: 'Menú eliminado exitosamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error eliminando menú',
        error: error.message
      });
    }
  }

  // Get menu tree structure
  static async getMenuTree(req, res) {
    try {
      const buildMenuTree = async (parentId = null, level = 1) => {
        const menus = await Menu.find({ 
          menuSuperior: parentId,
          activo: true 
        }).sort({ orden: 1, nombre: 1 });

        const menuTree = [];
        for (const menu of menus) {
          const menuItem = {
            ...menu.toObject(),
            nivel: level,
            children: await buildMenuTree(menu._id, level + 1)
          };
          menuTree.push(menuItem);
        }
        return menuTree;
      };

      const menuTree = await buildMenuTree();

      res.json({
        success: true,
        data: menuTree
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo árbol de menús',
        error: error.message
      });
    }
  }

  // Get root menus (no parent)
  static async getRootMenus(req, res) {
    try {
      const menus = await Menu.find({ 
        menuSuperior: null,
        activo: true 
      }).sort({ orden: 1, nombre: 1 });

      res.json({
        success: true,
        data: menus
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo menús raíz',
        error: error.message
      });
    }
  }

  // Get submenus of a parent menu
  static async getSubmenus(req, res) {
    try {
      const { parentId } = req.params;

      const menus = await Menu.find({ 
        menuSuperior: parentId,
        activo: true 
      }).sort({ orden: 1, nombre: 1 });

      res.json({
        success: true,
        data: menus
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo submenús',
        error: error.message
      });
    }
  }
}

module.exports = MenuController;

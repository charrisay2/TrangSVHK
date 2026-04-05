import { Request, Response } from 'express';
import Resource from '../models/Resource';

export const getResources = async (req: Request, res: Response) => {
  try {
    const { classId } = req.query;
    const where = classId ? { classId } : {};
    const resources = await Resource.findAll({ where });
    res.json(resources);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const createResource = async (req: Request, res: Response) => {
  try {
    const { title, type, url, classId } = req.body;
    const resource = await Resource.create({
      title,
      type,
      url,
      classId,
      uploadDate: new Date().toLocaleDateString('vi-VN'),
    });
    res.status(201).json(resource);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const deleteResource = async (req: Request, res: Response) => {
  try {
    const resource = await Resource.findByPk(req.params.id);
    if (resource) {
      await resource.destroy();
      res.json({ message: 'Resource removed' });
    } else {
      res.status(404).json({ message: 'Resource not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const updateResource = async (req: Request, res: Response) => {
  try {
    const { title } = req.body;
    const resource = await Resource.findByPk(req.params.id);
    if (resource) {
      resource.title = title || resource.title;
      await resource.save();
      res.json(resource);
    } else {
      res.status(404).json({ message: 'Resource not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

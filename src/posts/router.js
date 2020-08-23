const express = require('express')
const Post = require('./model')
const auth = require('../middleware/auth')
const allowedFields = require('../middleware/allowedFields')

const router = new express.Router()

// create post
router.post('/posts', auth, async (req, res) => {
	const post = new Post({ ...req.body, author: req.user._id })
	try {
		await post.save()
		req.user.posts.push(post._id)
		await req.user.save()
		res.status(201).send(post)
	} catch (e) {
		res.status(400).send(e)
	}
})

// read authenticated users posts
router.get('/posts/me', auth, async (req, res) => {
	try {
		await req.user.populate('posts').execPopulate()
		res.send(req.user.posts)
	} catch (e) {
		res.status(500).send()
	}
})

// read post by id
router.get('/posts/:id', async (req, res) => {
	try {
		const post = await Post.findOne({ _id: req.params.id })
		if (!post) { return res.status(404).send() }
		res.send(post)
	} catch (e) {
		res.status(500).send()
	}
})

// update post
router.patch('/posts/:id', auth, allowedFields(Post.editableFields), async (req, res) => {
	try {
		const post = await Post.findOne({ _id: req.params.id })
		if (!post) { return res.status(404).send() }
		if (!post.editableByUser(req.user)) { return res.status(403).send() }
		
		req.fields.forEach(field => post[field] = req.body[field])
		await post.save()
		res.send(post)
	} catch (e) {
		res.status(500).send()
	}
})

module.exports = router
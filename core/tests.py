class VideoAPITest(TestCase):
  def setUp(self):
    self.user = User.objects.create_user(
        username='test', password='pass')
    self.client.force_login(self.user)

  def test_dashboard_requires_login(self):
    self.client.logout()
    res = self.client.get('/api/dashboard/')
    self.assertEqual(res.status_code, 401)

  def test_user_can_only_see_own_videos(self):
    other = User.objects.create_user('other','pass')
    VideoIdea.objects.create(creator=other, title='X')
    res = self.client.get('/api/dashboard/')
    self.assertEqual(res.json()['analytics']['total_videos'], 0)

  def test_create_video(self):
    res = self.client.post('/api/dashboard/', {'title':'My Video'})
    self.assertEqual(res.status_code, 201)
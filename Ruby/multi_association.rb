class Collection < ActiveRecord::Base
  # ActiveRecord multiple association retrieval and sort
  # A slightly terrifying method by which a Collection's associated
  # Article and List objects can be sorted into a mixed array by an
  # identical set of keys and returned as a single array [posts]
  def posts
    articles = self.articles.where(active: true).order(featured: :desc, priority: :desc, updated_at: :desc).to_a
    lists = self.lists.where(active: true).order(featured: :desc, priority: :desc, updated_at: :desc).to_a
    posts = []

    begin
      if articles.length > 0 && lists.length > 0
        article, list = [articles[0], lists[0]]
        af, lf, ef, ap, lp, ep, au, lu, eu = [
          (article.featured & !list.featured),
          (list.featured & !article.featured),
          (article.featured & list.featured),
          (article.priority > list.priority),
          (list.priority > article.priority),
          (article.priority == list.priority),
          (article.updated_at > list.updated_at),
          (list.updated_at > article.updated_at),
          (article.updated_at == list.updated_at)
        ]
        wf = ((af | lf) & !ef)
        wp = ((ap | lp) & !ep)
        wu = ((au | lu) & !eu)

        insert = nil
        if (wf & af)
          insert = :articles
        elsif (wf & lf)
          insert = :lists
        elsif (wp & ap)
          insert = :articles
        elsif (wp & lp)
          insert = :lists
        elsif (wu & au)
          insert = :articles
        elsif (wu & lu)
          insert = :lists
        else
          insert = :articles
        end

        if insert == :articles
          posts << article
          articles.shift
        else
          posts << list
          lists.shift
        end
      else
        posts = posts + articles + lists
        articles, lists = [[], []]
      end
    end while (articles.length > 0 || lists.length > 0)
    return posts
  end
end
